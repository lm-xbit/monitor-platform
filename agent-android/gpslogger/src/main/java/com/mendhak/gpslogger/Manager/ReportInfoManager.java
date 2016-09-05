package com.mendhak.gpslogger.Manager;

/**
 * Created by steven.li on 9/5/16.
 */
public class ReportInfoManager {
    public static final ReportInfoManager stance = new ReportInfoManager();

    private ReportInfoManager() {
    }

    public long mTime;
    public String mMessage;
    public int mCode;

    public void setMessage(String message) {
        this.mMessage = message;
        mTime = System.currentTimeMillis();
    }
}
