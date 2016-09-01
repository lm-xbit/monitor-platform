package com.mendhak.gpslogger.common.events;


public class UploadEvents {

    // baseeventclass

    // new Baseuploadvent.   b.message = "X";
    // public class AutoEmailEvent extends thebaseone {}

    static abstract class BaseUploadEvent{
        public boolean success;
        public String message;
        public Throwable throwable;


        /**
         * Convenience function, returns a succeeded event
         */
        public <T extends BaseUploadEvent> T succeeded(){
            this.success = true;
            return (T) this;
        }

        /**
         * Convenience function, returns a succes event with a message
         */
        public <T extends BaseUploadEvent> T succeeded(String message){
            this.success = true;
            this.message = message;
            return (T) this;
        }


        /**
         * Convenience function, returns a failed event
         */
        public <T extends BaseUploadEvent> T failed(){
            this.success = false;
            this.message = null;
            this.throwable = null;
            return (T)this;
        }

        /**
         * Convenience function, returns a failed event with just a message
         */
        public <T extends BaseUploadEvent> T failed(String message){
            this.success = false;
            this.message = message;
            this.throwable = null;
            return (T)this;
        }

        /**
         * Convenience function, returns a failed event with a message and a throwable
         */
        public <T extends BaseUploadEvent> T failed(String message, Throwable throwable){
            this.success = false;
            this.message = message;
            this.throwable = throwable;
            return (T)this;
        }
    }

    public static class OpenGTS extends BaseUploadEvent {}
}
