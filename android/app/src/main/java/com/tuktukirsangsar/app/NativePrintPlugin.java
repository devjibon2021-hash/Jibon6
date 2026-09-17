package com.tuktukirsangsar.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.os.Environment;
import android.provider.MediaStore;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintDocumentInfo;
import android.print.PrintManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.IOException;

@CapacitorPlugin(name = "NativePrint")
public class NativePrintPlugin extends Plugin {
    private WebView printWebView;

    @PluginMethod
    public void printReport(PluginCall call) {
        String html = call.getString("html");
        String jobName = call.getString("jobName");
        if (jobName == null || jobName.trim().isEmpty()) jobName = "টুকটুকির সংসার - রিপোর্ট";
        if (html == null || html.trim().isEmpty()) {
            call.reject("No report content supplied");
            return;
        }

        getActivity().runOnUiThread(() -> {
            printWebView = createPrintWebView();
            printWebView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    PrintManager printManager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                    if (printManager == null) {
                        call.reject("Android print service is unavailable");
                        return;
                    }
                    PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(jobName);
                    PrintAttributes attributes = new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                            .build();
                    printManager.print(jobName, adapter, attributes);
                    call.resolve();
                }
            });
            printWebView.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
        });
    }

    @PluginMethod
    public void savePdf(PluginCall call) {
        String html = call.getString("html");
        String fileName = call.getString("fileName");
        if (fileName == null || fileName.trim().isEmpty()) fileName = "tuktukir_sangsar_report.pdf";
        if (html == null || html.trim().isEmpty()) {
            call.reject("No report content supplied");
            return;
        }
        fileName = sanitizePdfName(fileName);
        final String finalFileName = fileName;

        getActivity().runOnUiThread(() -> {
            WebView webView = createPrintWebView();
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageFinished(WebView view, String url) {
                    writePdf(view, finalFileName, call);
                }
            });
            webView.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
        });
    }

    private WebView createPrintWebView() {
        WebView webView = new WebView(getActivity());
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setBuiltInZoomControls(false);
        webView.setBackgroundColor(android.graphics.Color.WHITE);
        return webView;
    }

    private void writePdf(WebView webView, String fileName, PluginCall call) {
        PrintDocumentAdapter adapter = webView.createPrintDocumentAdapter(fileName.replace(".pdf", ""));
        PrintAttributes attributes = new PrintAttributes.Builder()
                .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                .setResolution(new PrintAttributes.Resolution("pdf", "PDF", 300, 300))
                .build();

        final Uri[] outputUri = new Uri[1];
        final ParcelFileHolder[] holder = new ParcelFileHolder[1];
        try {
            outputUri[0] = createOutputUri(fileName);
            holder[0] = new ParcelFileHolder(openOutputDescriptor(outputUri[0]));
            if (holder[0].descriptor == null) throw new IOException("Could not open PDF destination");

            CancellationSignal cancellationSignal = new CancellationSignal();
            adapter.onLayout(null, attributes, cancellationSignal, new PrintDocumentAdapter.LayoutResultCallback() {
                @Override
                public void onLayoutFinished(PrintDocumentInfo info, boolean changed) {
                    adapter.onWrite(
                            new android.print.PageRange[]{android.print.PageRange.ALL_PAGES},
                            holder[0].descriptor,
                            cancellationSignal,
                            new PrintDocumentAdapter.WriteResultCallback() {
                                @Override
                                public void onWriteFinished(android.print.PageRange[] pages) {
                                    finishPdfSuccess(outputUri[0], fileName, call, holder[0]);
                                    webView.destroy();
                                }

                                @Override
                                public void onWriteFailed(CharSequence error) {
                                    finishPdfFailure(outputUri[0], error == null ? "PDF generation failed" : error.toString(), call, holder[0]);
                                    webView.destroy();
                                }
                            }
                    );
                }

                @Override
                public void onLayoutFailed(CharSequence error) {
                    finishPdfFailure(outputUri[0], error == null ? "PDF layout failed" : error.toString(), call, holder[0]);
                    webView.destroy();
                }
            }, new Bundle());
        } catch (Exception e) {
            if (holder[0] != null) holder[0].close();
            deleteUri(outputUri[0]);
            call.reject("Unable to create PDF: " + e.getMessage());
            webView.destroy();
        }
    }


    private android.os.ParcelFileDescriptor openOutputDescriptor(Uri uri) throws IOException {
        if ("file".equals(uri.getScheme())) {
            return android.os.ParcelFileDescriptor.open(
                    new File(uri.getPath()),
                    android.os.ParcelFileDescriptor.MODE_CREATE | android.os.ParcelFileDescriptor.MODE_TRUNCATE | android.os.ParcelFileDescriptor.MODE_WRITE_ONLY
            );
        }
        return getActivity().getContentResolver().openFileDescriptor(uri, "w");
    }

    private Uri createOutputUri(String fileName) throws IOException {
        ContentResolver resolver = getActivity().getContentResolver();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
            values.put(MediaStore.Downloads.MIME_TYPE, "application/pdf");
            values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/টুকটুকির সংসার");
            values.put(MediaStore.Downloads.IS_PENDING, 1);
            Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
            if (uri == null) throw new IOException("Downloads folder is unavailable");
            return uri;
        }

        File dir = getActivity().getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS);
        if (dir == null) dir = getActivity().getCacheDir();
        if (!dir.exists() && !dir.mkdirs()) throw new IOException("Cannot create document folder");
        return Uri.fromFile(new File(dir, fileName));
    }

    private void finishPdfSuccess(Uri uri, String fileName, PluginCall call, ParcelFileHolder holder) {
        holder.close();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q && uri != null) {
            ContentValues values = new ContentValues();
            values.put(MediaStore.Downloads.IS_PENDING, 0);
            getActivity().getContentResolver().update(uri, values, null, null);
        }
        JSObject result = new JSObject();
        result.put("fileName", fileName);
        if (uri != null) result.put("uri", uri.toString());
        call.resolve(result);
    }

    private void finishPdfFailure(Uri uri, String error, PluginCall call, ParcelFileHolder holder) {
        holder.close();
        deleteUri(uri);
        call.reject(error);
    }

    private void deleteUri(Uri uri) {
        if (uri == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q || "content".equals(uri.getScheme())) {
                getActivity().getContentResolver().delete(uri, null, null);
            } else if ("file".equals(uri.getScheme())) {
                File file = new File(uri.getPath());
                if (file.exists()) file.delete();
            }
        } catch (Exception ignored) {}
    }

    private String sanitizePdfName(String name) {
        String clean = name.replaceAll("[\\\\/:*?\"<>|]", "_");
        if (!clean.toLowerCase().endsWith(".pdf")) clean += ".pdf";
        return clean;
    }

    private static class ParcelFileHolder {
        final android.os.ParcelFileDescriptor descriptor;
        ParcelFileHolder(android.os.ParcelFileDescriptor descriptor) { this.descriptor = descriptor; }
        void close() { try { if (descriptor != null) descriptor.close(); } catch (IOException ignored) {} }
    }
}
