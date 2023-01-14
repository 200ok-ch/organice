package com.twohundredok.organice;

import static org.junit.Assert.*;

import android.net.Uri;

import androidx.documentfile.provider.DocumentFile;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;

import java.io.File;

@RunWith(RobolectricTestRunner.class)
public class OrganiceSyncTest {


    @Test
    public void uriTest(){
        var base = Uri.parse("content://com.android.externalstorage.documents/tree/1413-3A04%3Aorg");
        var document = Uri.parse("content://com.android.externalstorage.documents/tree/1413-3A04%3Aorg/document/1413-3A04%3Aorg%2Fmanual.org");
        var encodedPath = "/document/1413-3A04%3Aorg%2Fmanual.org";

        var uri2 = base.buildUpon().appendPath("path").build();
        var uri3 = uri2.buildUpon().appendPath("localPath").build();

        var uri4 = OrganiceSync.pathToUri(base,"local3");


        DocumentFile.fromFile(new File("local"));

        System.out.println("" + base.getPath());

    }


}