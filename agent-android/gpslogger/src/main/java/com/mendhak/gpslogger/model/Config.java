package com.mendhak.gpslogger.model;

/**
 * Created by steven.li on 8/26/16.
 */
public class Config {

    public Gate gate;
    public App app;
    public String code;

    public class Gate {
        public boolean ssl;
        public String host;
        public int port;
    }

    public class App {
        public String key;
        public long interval;
        public String type = "mobile-track";
    }

}
