import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, clear_notification } from "@/store/main";

const GV_Notification: React.FC = () => {
  const dispatch = useDispatch();
  const notification = useSelector((state: RootState) => state.notification);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (notification.visible) {
      timer = setTimeout(() => {
        dispatch(clear_notification());
      }, 3000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [notification.visible, dispatch]);

  const handleUndo = () => {
    // For now, simply clear the notification.
    // In a real scenario, you might also trigger an undo restoration.
    dispatch(clear_notification());
  };

  const handleDismiss = () => {
    dispatch(clear_notification());
  };

  return (
    <>
      {notification.visible && (
        <div className="fixed top-4 inset-x-0 flex justify-center z-50 pointer-events-none">
          <div className="bg-gray-800 text-white px-4 py-2 rounded shadow-lg flex items-center pointer-events-auto">
            <span className="text-sm">{notification.message}</span>
            {notification.action && (
              <button
                onClick={handleUndo}
                className="ml-4 underline text-sm hover:text-gray-300"
              >
                {notification.action}
              </button>
            )}
            <button
              onClick={handleDismiss}
              className="ml-4 text-xl leading-none hover:text-gray-300 focus:outline-none"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GV_Notification;