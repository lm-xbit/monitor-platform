package com.mendhak.gpslogger.model;

/**
 * Created with IntelliJ IDEA.
 * User: ning.chen
 * Date: 3/16/16
 * To change this template use File | Settings | File Templates.
 */
public class Sample {
    public final boolean valid;

    public final long epoch;
    public final double lat;
    public final double lng;
    public final double alt;
    public final double speed;
    public final double bearing;
    public final double accuracy;

    /**
     * Create a sample with given location infomration
     * @param epoch
     * @param lat
     * @param lng
     * @param alt
     * @param s
     * @param b
     * @param a
     */
    public Sample(long epoch, double lat, double lng, double alt, double s, double b, double a) {
        this.epoch = epoch;
        this.lat = lat;
        this.lng = lng;
        this.alt = alt;
        this.speed = s;
        this.bearing = b;
        this.accuracy = a;

        this.valid = true;
    }

    /**
     * We missed a time, so create NaN
     * @param epoch
     */
    public Sample(long epoch) {
        this.epoch = epoch;

        this.lat = Double.NaN;
        this.lng = Double.NaN;
        this.alt = Double.NaN;
        this.speed = Double.NaN;
        this.bearing = Double.NaN;
        this.accuracy = Double.NaN;

        this.valid = false;
    }
}
