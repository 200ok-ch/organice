package com.twohundredok.organice;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(OrganiceSync.class);
        super.onCreate(savedInstanceState);
    }
}
