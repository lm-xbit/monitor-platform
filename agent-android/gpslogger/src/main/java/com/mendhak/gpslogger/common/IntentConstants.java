package com.mendhak.gpslogger.common;

public class IntentConstants {
    public final static String IMMEDIATE_STOP = "immediatestop";
    public final static String IMMEDIATE_START =  "immediatestart";

    /**
     * Try get next GPS point if GPS is available
     */
    public static final String GET_NEXT_GPS_POINT = "next-gps-point";

    /**
     * Try get next network position if network is available
     */
    public static final String GET_NEXT_NETWORK_POINT = "next-network-point";

    public static final String SET_DESCRIPTION = "setnextpointdescription";

    public static final String GPS_LOCATION_UPDATE_TIMEOUT = "gps-location-update-timeout";
    public static final String NETWORK_LOCATION_UPDATE_TIMEOUT = "network-location-update-timeout";
}
