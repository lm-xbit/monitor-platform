/*
*    This file is part of GPSLogger for Android.
*
*    GPSLogger for Android is free software: you can redistribute it and/or modify
*    it under the terms of the GNU General Public License as published by
*    the Free Software Foundation, either version 2 of the License, or
*    (at your option) any later version.
*
*    GPSLogger for Android is distributed in the hope that it will be useful,
*    but WITHOUT ANY WARRANTY; without even the implied warranty of
*    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
*    GNU General Public License for more details.
*
*    You should have received a copy of the GNU General Public License
*    along with GPSLogger for Android.  If not, see <http://www.gnu.org/licenses/>.
*/

package com.mendhak.gpslogger.receivers;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Handler;
import com.mendhak.gpslogger.GpsLoggingService;
import com.mendhak.gpslogger.Manager.CheckConnectionManager;
import com.mendhak.gpslogger.common.AppSettings;
import com.mendhak.gpslogger.common.events.CommandEvents;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.mendhak.gpslogger.utils.LogUtil;
import de.greenrobot.event.EventBus;
import org.slf4j.Logger;


public class ReportDataReceiver extends BroadcastReceiver {

    public static final String INTENT_ACTION_REPORT = "REPORT_gps_location_samples";

    private static final Logger LOG = Logs.of(ReportDataReceiver.class);

    @Override
    public void onReceive(Context context, final Intent intent) {
        try {
            LOG.debug("Report received");
            if (INTENT_ACTION_REPORT.equalsIgnoreCase(intent.getAction())) {
                Intent serviceIntent = new Intent(AppSettings.getInstance(), GpsLoggingService.class);
                context.startService(serviceIntent);
                CheckConnectionManager.stance.init();
                if (CheckConnectionManager.stance.hasConfig()) {
                    new Handler().postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            EventBus.getDefault().postSticky(new CommandEvents.RequestStartStop(true));
                            LogUtil.d("ReportDataReceiver", "ReportDataReceiver delay ---> Starting GpsLoggingService");
                        }
                    }, 50);
                }
                new Handler().postDelayed(new Runnable() {
                    @Override
                    public void run() {
                        EventBus.getDefault().postSticky(new CommandEvents.Report());
                        LogUtil.d("ReportDataReceiver", "ReportDataReceiver delay --> CommandEvents.Report");
                    }
                }, 168);
            }
        } catch (Exception ex) {
            LOG.error("Report", ex);
        }
    }
}
