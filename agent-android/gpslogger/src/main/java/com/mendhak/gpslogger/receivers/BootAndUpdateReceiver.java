package com.mendhak.gpslogger.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import com.mendhak.gpslogger.GpsLoggingService;
import com.mendhak.gpslogger.common.slf4j.Logs;
import org.slf4j.Logger;

/**
 * Created with IntelliJ IDEA.
 * User: ning.chen
 * Date: 3/22/16
 * To change this template use File | Settings | File Templates.
 */
public class BootAndUpdateReceiver extends BroadcastReceiver {
    private static final String TAG = "BootAndUpdateReceiver";
    private static final Logger LOG = Logs.of(BootAndUpdateReceiver.class);

       @Override
       public void onReceive(Context context, Intent intent) {
           if (intent.getAction().equals("android.intent.action.BOOT_COMPLETED") ||
                   intent.getAction().equals("android.intent.action.MY_PACKAGE_REPLACED")) {
               LOG.info("Try start service due to action - " + intent.getAction());
               Intent startServiceIntent = new Intent(context.getApplicationContext(), GpsLoggingService.class);
               context.startService(startServiceIntent);
           }
       }
}
