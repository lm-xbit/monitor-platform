package com.mendhak.gpslogger.model;

/**
 * Created by steven.li on 8/26/16.
 *
 * This class will be instantiated by GsonUtil.fromJson
 */
public class Config {
    public Gate gate;
    public App app;

    /**
     * Basic information, used for initial connection confirmation
     */
    public String code;
    public boolean ssl;
    public String host;
    public int port;

    /**
     * Gate is used for reporting collected data
     */
    public class Gate {
        public boolean ssl;
        public String host;
        public int port;
        public String uri; // URI to use to report data to, default to
    }

    /**
     * Application settings
     */
    public class App {
        public String key;
        public long interval;
        public final String type = "mobile-track";
    }

}
