package com.mendhak.gpslogger.senders.owncloud;

import com.mendhak.gpslogger.common.AppSettings;
import com.mendhak.gpslogger.common.PreferenceHelper;
import com.mendhak.gpslogger.common.Strings;
import com.mendhak.gpslogger.common.events.UploadEvents;
import com.mendhak.gpslogger.common.slf4j.Logs;
import com.mendhak.gpslogger.loggers.Files;
import com.mendhak.gpslogger.senders.FileSender;
import com.mendhak.gpslogger.ui.fragments.settings.OwnCloudSettingsFragment;
import com.path.android.jobqueue.CancelResult;
import com.path.android.jobqueue.JobManager;
import com.path.android.jobqueue.TagConstraint;
import de.greenrobot.event.EventBus;
import org.slf4j.Logger;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.util.List;

public class OwnCloudManager extends FileSender
{
    private static final Logger LOG = Logs.of(OwnCloudSettingsFragment.class);
    private PreferenceHelper preferenceHelper;

    public OwnCloudManager(PreferenceHelper preferenceHelper) {
        this.preferenceHelper = preferenceHelper;
    }

    public void testOwnCloud(final String servername, final String username, final String password, final String directory) {

        File gpxFolder = new File(preferenceHelper.getGpsLoggerFolder());
        if (!gpxFolder.exists()) {
            gpxFolder.mkdirs();
        }

        LOG.debug("Creating gpslogger_test.xml");
        final File testFile = new File(gpxFolder.getPath(), "gpslogger_test.xml");

        try {
            if (!testFile.exists()) {
                testFile.createNewFile();

                FileOutputStream initialWriter = new FileOutputStream(testFile, true);
                BufferedOutputStream initialOutput = new BufferedOutputStream(initialWriter);

                initialOutput.write("<x>This is a test file</x>".getBytes());
                initialOutput.flush();
                initialOutput.close();

                Files.addToMediaDatabase(testFile, "text/xml");
            }

        } catch (Exception ex) {
            EventBus.getDefault().post(new UploadEvents.Ftp().failed());
            LOG.error("Error while testing ownCloud upload: " + ex.getMessage());
        }

        final JobManager jobManager = AppSettings.getJobManager();
        jobManager.cancelJobsInBackground(new CancelResult.AsyncCancelCallback() {
            @Override
            public void onCancelled(CancelResult cancelResult) {
                jobManager.addJobInBackground(new OwnCloudJob(servername, username, password, directory,
                        testFile, "gpslogger_test.txt"));
            }
        }, TagConstraint.ANY, OwnCloudJob.getJobTag(testFile));

        LOG.debug("Added background ownCloud upload job");
    }

    public static boolean validSettings(
            String servername,
            String username,
            String password,
            String directory) {
        return !Strings.isNullOrEmpty(servername);

    }

    @Override
    public void uploadFile(List<File> files)
    {
        for (File f : files) {
            uploadFile(f);
        }
    }

    @Override
    public boolean isAvailable() {
        return validSettings(preferenceHelper.getOwnCloudServerName(),
                preferenceHelper.getOwnCloudUsername(),
                preferenceHelper.getOwnCloudPassword(),
                preferenceHelper.getOwnCloudDirectory());
    }

    @Override
    public boolean hasUserAllowedAutoSending() {
        return preferenceHelper.isOwnCloudAutoSendEnabled();
    }

    public void uploadFile(final File f)
    {
        final JobManager jobManager = AppSettings.getJobManager();
        jobManager.cancelJobsInBackground(new CancelResult.AsyncCancelCallback() {
            @Override
            public void onCancelled(CancelResult cancelResult) {
                jobManager.addJobInBackground(new OwnCloudJob(
                        preferenceHelper.getOwnCloudServerName(),
                        preferenceHelper.getOwnCloudUsername(),
                        preferenceHelper.getOwnCloudPassword(),
                        preferenceHelper.getOwnCloudDirectory(),
                        f, f.getName()));
            }
        }, TagConstraint.ANY, OwnCloudJob.getJobTag(f));

    }

    @Override
    public boolean accept(File dir, String name) {
        return true;
    }


}