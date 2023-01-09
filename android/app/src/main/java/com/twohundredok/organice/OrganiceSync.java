package com.twohundredok.organice;

import android.annotation.SuppressLint;
import android.content.Intent;
import android.net.Uri;

import androidx.activity.result.ActivityResult;
import androidx.documentfile.provider.DocumentFile;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Organice sync backend for Android.
 * Allows Organice to select a directory and use the files within.
 */
@CapacitorPlugin(name = "OrganiceSync")
public class OrganiceSync extends Plugin {

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
     *
     * Will save permissions to the directory.
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

            ret.put("uri", uri);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("intent", result.getData());
            ret.put("resultCode", result.getResultCode());
            ret.put("uri", null);
            call.reject("Failed with intent code " + result.getResultCode(), ret);
        }
    }

    /**
     * Convert a DocumentFile to JSObject file structure to send to JS code.
     * Organice cna use this format to display file information.
     *
     * @param d
     * @return
     */
    public static JSObject asFileMetaData(DocumentFile d) {
        if (d == null) {
            throw new IllegalArgumentException("DocumentFile is null");
        }
        if (!d.exists()) {
            throw new IllegalStateException("DocumentFile does not exist:" + d);
        }
        DocumentFile parentFile = d.getParentFile();
        JSObject o = new JSObject();
        o.put("uri", d.getUri());
        o.put("lastModified", d.lastModified());
        o.put("length", d.length());
        o.put("name", d.getName());
        o.put("type", d.getType());
        o.put("isDirectory", d.isDirectory());
        o.put("isFile", d.isFile());
        o.put("parentFileUri", parentFile.getUri());
        o.put("parentFileName", parentFile.getName());
        return o;
    }

    /**
     * List files in a directory.
     * @param call Expect a "uri" string parameter.
     */
    @PluginMethod
    public void listFiles(PluginCall call) {
        String uriStr = call.getString("uri");
        if (uriStr != null) {
            Uri uri = Uri.parse(Uri.decode(uriStr));
            var d = DocumentFile.fromTreeUri(getContext(), uri);
            if (d.exists() && d.isDirectory()) {
                JSObject ret = new JSObject();
                var files = d.listFiles();
                // convert DocumentFile to a json object structure for use in organice
                var listing = Arrays.stream(files)
                        .map(OrganiceSync::asFileMetaData)
                        .collect(Collectors.toList());
                ret.put("files", listing);
                call.resolve(ret);
            } else {
                JSObject ret = new JSObject();
                ret.put("error", true);
                ret.put("uri", uri);
                ret.put("cause", "Usi is not a directory ");
                call.reject("Usi is not a directory " + uri);
            }
        }
        call.reject("Uri is null");
        return;
    }

}
