package com.tuktukirsangsar.app;

import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.pdf.PdfDocument;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
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
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.regex.Pattern;

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
        final String finalJobName = jobName;
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
                    PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(finalJobName);
                    PrintAttributes attributes = new PrintAttributes.Builder()
                            .setMediaSize(PrintAttributes.MediaSize.ISO_A4)
                            .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                            .build();
                    printManager.print(finalJobName, adapter, attributes);
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
        final String finalFileName = sanitizePdfName(fileName);
        final String text = htmlToText(html);
        getActivity().runOnUiThread(() -> writePdf(finalFileName, text, call));
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

    /** Creates a PDF directly. PrintDocumentAdapter callbacks have package-private
     * constructors on recent Android SDKs, so they cannot be instantiated here. */
    private void writePdf(String fileName, String text, PluginCall call) {
        Uri outputUri = null;
        ParcelFileHolder holder = null;
        PdfDocument document = new PdfDocument();
        try {
            outputUri = createOutputUri(fileName);
            holder = new ParcelFileHolder(openOutputDescriptor(outputUri));
            if (holder.descriptor == null) throw new IOException("Could not open PDF destination");

            Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            paint.setColor(android.graphics.Color.BLACK);
            paint.setTextSize(11f);
            int pageWidth = 595;
            int pageHeight = 842;
            int margin = 40;
            int lineHeight = 16;
            int linesPerPage = (pageHeight - margin * 2) / lineHeight;
            String[] lines = text.split("\\n", -1);
            int index = 0;
            while (index < lines.length || index == 0) {
                PdfDocument.Page page = document.startPage(new PdfDocument.PageInfo.Builder(pageWidth, pageHeight, document.getPages().size() + 1).create());
                Canvas canvas = page.getCanvas();
                float y = margin + lineHeight;
                int count = 0;
                while (index < lines.length && count < linesPerPage) {
                    String line = lines[index++];
                    if (line.length() > 90) line = line.substring(0, 90);
                    canvas.drawText(line, margin, y, paint);
                    y += lineHeight;
                    count++;
                }
                document.finishPage(page);
            }
            document.writeTo(new FileOutputStream(holder.descriptor.getFileDescriptor()));
            document.close();
            finishPdfSuccess(outputUri, fileName, call, holder);
        } catch (Exception e) {
            document.close();
            if (holder != null) holder.close();
            deleteUri(outputUri);
            call.reject("Unable to create PDF: " + (e.getMessage() == null ? "unknown error" : e.getMessage()));
        }
    }

    private String htmlToText(String html) {
        String text = html.replaceAll("(?i)<br\\s*/?>", "\\n")
                .replaceAll("(?i)</(p|div|h[1-6]|tr|li)>", "\\n")
                .replaceAll("<[^>]*>", "")
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
        return Pattern.compile("\\n{3,}").matcher(text).replaceAll("\\n\\n").trim();
    }

    private android.os.ParcelFileDescriptor openOutputDescriptor(Uri uri) throws IOException {
        if ("file".equals(uri.getScheme())) {
            return android.os.ParcelFileDescriptor.open(new File(uri.getPath()),
                    android.os.ParcelFileDescriptor.MODE_CREATE | android.os.ParcelFileDescriptor.MODE_TRUNCATE | android.os.ParcelFileDescriptor.MODE_WRITE_ONLY);
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

    private void deleteUri(Uri uri) {
        if (uri == null) return;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q || "content".equals(uri.getScheme())) getActivity().getContentResolver().delete(uri, null, null);
            else if ("file".equals(uri.getScheme())) new File(uri.getPath()).delete();
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
