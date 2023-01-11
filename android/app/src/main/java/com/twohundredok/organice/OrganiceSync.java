package com.twohundredok.organice;

import android.annotation.SuppressLint;
import android.content.ContentResolver;
import android.content.Intent;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import android.provider.DocumentsContract;

import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.BufferedReader;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Organice sync backend for Android.
 * Allows Organice to select a directory and use the files within.
 */
@CapacitorPlugin(name = "OrganiceSync")
public class OrganiceSync extends Plugin {

    public static Uri pathToUri(Uri base, String path) {
        if (path.isEmpty()) {
            return base;
        } else {
            var p = path.startsWith("/") ? path.substring(1) : path;
            return base.buildUpon().encodedPath(p).build();
        }
    }

    /**
     * API available in JS to open the org root directory.
     *
     * @param call
     */
    @PluginMethod
    public void pickDirectory(PluginCall call) {
        // Sample code from https://github.com/android/storage-samples/blob/main/StorageClient/Application/src/main/java/com/example/android/storageclient/StorageClientFragment.java
        // BEGIN_INCLUDE (use_open_document_intent)
        // ACTION_OPEN_DOCUMENT is the intent to choose a file via the system's file browser.
        Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);

        // Optionally, specify a URI for the directory that should be opened in
        // the system file picker when it loads.
        // intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, uriToLoad);

        // https://capacitorjs.com/docs/plugins/android#intents-with-results
        startActivityForResult(call, intent, "pickDirectoryResult");
    }

    /**
     * Companion callback to {@link OrganiceSync::pickDirectory} .
     * Handles the result of "pick a directory" action.
     * <p>
     * Will save permissions to the directory.
     *
     * @param call
     * @param result
     */
    @SuppressLint("WrongConstant")
    @ActivityCallback
    public void pickDirectoryResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            return;
        }

        Intent intent = result.getData();

        if (intent != null) {
            Uri uri = intent.getData();
            JSObject ret = new JSObject();

            // Persist permissions
            // https://developer.android.com/training/data-storage/shared/documents-files#grant-access-directory
            final int takeFlags = intent.getFlags()
                    & (Intent.FLAG_GRANT_READ_URI_PERMISSION
                    | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            // Check for the freshest data.
            getActivity().getContentResolver().takePersistableUriPermission(uri, takeFlags);

            var d = DocumentFile.fromTreeUri(getContext(),uri);

            ret.put("uri", uri);
            ret.put("path", d.getUri().getEncodedPath());
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("intent", result.getData());
            ret.put("resultCode", result.getResultCode());
            ret.put("uri", null);
            call.reject("Failed with intent code " + result.getResultCode(), ret);
        }
    }

    public static JSObject asFileMetaData(DocumentFile d) {
        if (d == null) {
            throw new IllegalArgumentException("DocumentFile is null");
        }
        if (!d.exists()) {
            throw new IllegalStateException("DocumentFile does not exist:" + d);
        }
        var o = new JSObject();
        o.put("id", d.getUri().toString());
        o.put("path", d.getUri().getEncodedPath());
        o.put("lastModified", d.lastModified());
        o.put("length", d.length());
        o.put("name", d.getName());
        o.put("type", d.getType());
        o.put("isDirectory", d.isDirectory());
        o.put("isFile", d.isFile());
        return o;
    }

    /**
     * List files in a directory.
     *
     * @param call Expect a "uri" string parameter.
     */
    @PluginMethod
    public void listFiles(PluginCall call) {
        String uriStr = call.getString("uri");
        String path = call.getString("path");
        if (uriStr != null && path != null) {
            try {
                final Uri base = Uri.parse(uriStr);
                final Uri uri = pathToUri(base, path);
                var d = DocumentFile.fromTreeUri(getContext(), uri);
                if (d.exists() && d.isDirectory()) {
                    JSObject ret = new JSObject();
                    var files = d.listFiles();
                    // convert DocumentFile to a json object structure for use in organice
                    var listing = Arrays.stream(files)
                            .map(OrganiceSync::asFileMetaData)
                            .collect(Collectors.toList());
                    ret.put("files", new JSArray(listing));
                    call.resolve(ret);
                } else {
                    JSObject ret = new JSObject();
                    ret.put("error", true);
                    ret.put("uri", base);
                    ret.put("errorMessage", "Usi is not a directory ");
                    call.reject("Usi is not a directory " + uri);
                }
            } catch (Exception e) {
                JSObject o = new JSObject();
                o.put("error", true);
                o.put("uriStr", uriStr);
//                o.put("uri", uri.toString());
                o.put("path", path);
                o.put("errorMessage", e.getLocalizedMessage());
                call.reject("Exception writing uri" + uriStr, o);
            }
        } else {
            call.reject("Uri or path is null");
        }
    }

    public void writeFile(ContentResolver resolver, Uri uri, String data) throws Exception {
        try (ParcelFileDescriptor pfd = resolver.openFileDescriptor(uri, "w");
             FileOutputStream fileOutputStream = new FileOutputStream(pfd.getFileDescriptor())) {
            fileOutputStream.write(data.getBytes(StandardCharsets.UTF_8));
        }
    }

    /**
     * Update / write to a file.
     * Perform a full file write.
     *
     * @param call Expect a "uri" string parameter.
     */
    @PluginMethod
    public void putFileContents(PluginCall call) {
        String uriStr = call.getString("uri");
        String data = call.getString("contents");
        String path = call.getString("path");
        if (uriStr != null && path != null) {
            Uri base = Uri.parse(uriStr);
            Uri uri = pathToUri(base, path);
            try {
                ContentResolver resolver = getActivity().getContentResolver();
                writeFile(resolver, uri, data);
            } catch (Exception e) {
                JSObject o = new JSObject();
                o.put("error", true);
                o.put("uri", uri);
                o.put("errorMessage", e.getLocalizedMessage());
                call.reject("Exception writing uri" + uri, o);
            }
        } else {
            call.reject("Uri is null");
        }
    }

    /**
     * Read a document to a string.
     * https://developer.android.com/training/data-storage/shared/documents-files#input_stream
     *
     * @param uri
     * @return
     * @throws IOException
     */
    public static String readTextFromUri(ContentResolver resolver, Uri uri) throws IOException {
        StringBuilder stringBuilder = new StringBuilder();
        try (InputStream fis = resolver.openInputStream(uri);
             BufferedReader reader = new BufferedReader(new InputStreamReader(fis, StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                stringBuilder.append(line);
            }
        }
        return stringBuilder.toString();
    }

    /**
     * @param call
     */
    @PluginMethod
    public void getFileContentsAndMetadata(PluginCall call) {
        String uriStr = call.getString("uri");
        String path = call.getString("path");
        if (uriStr != null && path != null) {
            var uri = Uri.parse(uriStr).buildUpon().encodedPath(path).build();
            try {
                ContentResolver resolver = getContext().getContentResolver();
                var contents = readTextFromUri(resolver, uri);
                var d = DocumentFile.fromSingleUri(getContext(), uri);
                Instant i = Instant.ofEpochMilli(d.lastModified());
                LocalDateTime date = i.atZone(ZoneId.systemDefault()).toLocalDateTime();
                JSObject r = asFileMetaData(d);
                r.put("contents", contents);
                r.put("lastModifiedAt", date.format(DateTimeFormatter.ISO_DATE_TIME));
                call.resolve(r);
            } catch (Exception e) {
                JSObject o = new JSObject();
                o.put("error", true);
                o.put("uriStr", uriStr);
                o.put("uri", uri.toString());
                o.put("path", path);
                o.put("errorMessage", e.getLocalizedMessage());
                call.reject("Exception writing uri" + uriStr, o);
            }
        } else {
            JSObject o = new JSObject();
            o.put("error", true);
            o.put("message", "Uri or path is null");
            call.reject("Uri or path is null", o);
        }
    }

    /**
     * https://developer.android.com/training/data-storage/shared/documents-files#create-file
     *
     * @param call
     */
    @PluginMethod
    public void createFile(PluginCall call) {
        String uriStr = call.getString("uri");
        String path = call.getString("path");
        String content = call.getString("content");
        if (uriStr == null || path == null) {
            JSObject o = new JSObject();
            o.put("error", true);
            o.put("message", "Uri or path is null");
            call.reject("Uri or path is null", o);
        }

        var base = Uri.parse(uriStr);
        var uri = pathToUri(base, path);
        var fileParent = removeLastPathSegment(uri);
        try {
            // https://www.reddit.com/r/androiddev/comments/mz2j9s/comment/gw1uddt/?utm_source=share&utm_medium=web2x&context=3
            var dir = DocumentFile.fromTreeUri(getContext(), fileParent);
            ContentResolver resolver = getContext().getContentResolver();
            Uri document = DocumentsContract.createDocument(resolver, uri , "application/octet-stream",
                    uri.getLastPathSegment());
            var file = DocumentFile.fromSingleUri(getContext(),document);
            writeFile(resolver, file.getUri(), content);
            JSObject r = asFileMetaData(dir);
            call.resolve(r);
        } catch (Exception e) {
            JSObject o = new JSObject();
            o.put("error", true);
            o.put("uriStr", uriStr);
            o.put("uri", uri.toString());
            o.put("path", path);
            o.put("parentFile", fileParent);
            o.put("errorMessage", e.getLocalizedMessage());
            call.reject("Exception writing uri" + uriStr, o);
        }
    }

    private Uri removeLastPathSegment(Uri uri) {
        var segments = uri.getPathSegments();
        segments = segments.subList(0,segments.size()-1);
        var u = uri.buildUpon();
        segments.forEach(s -> u.appendPath(s));
        return u.build();
    }

    /**
     * @param call
     */
    @PluginMethod
    public void deleteFile(PluginCall call) {
        String uriStr = call.getString("uri");
        String path = call.getString("path");
        if (uriStr != null && path != null) {
            Uri base = Uri.parse(uriStr);
            Uri uri = pathToUri(base, path);
            var f = DocumentFile.fromSingleUri(getContext(), uri);
            var deleted = f.delete();
            if (deleted) {
                call.resolve();
            } else {
                call.reject("File was not deleted");
            }
        } else {
            call.reject("Uri is null");
        }
    }

}
