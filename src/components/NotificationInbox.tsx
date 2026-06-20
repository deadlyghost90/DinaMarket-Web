import React, { useState, useEffect } from "react";
import { Bell, BellOff, Check, Trash2, Calendar } from "lucide-react";
import { UserNotification } from "../types";
import { auth, rtdb } from "../firebase";
import { ref, onValue, set, remove } from "firebase/database";
import { Language, getTranslation } from "../dictionary";

interface NotificationInboxProps {
  lang: Language;
}

export default function NotificationInbox({ lang }: NotificationInboxProps) {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const currentUser = auth.currentUser;

  // Listen to live database events on /notifications straight to the specific buyer
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      return;
    }

    const notifRef = ref(rtdb, "notifications");
    const unsubscribe = onValue(notifRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val()) as UserNotification[];
        // Filter specifically for this user's notifications
        const filtered = data.filter(n => n.userId === currentUser.uid);
        // Sort newest first
        filtered.sort((a,b) => b.timestamp - a.timestamp);
        setNotifications(filtered);
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    if (!currentUser || notifications.length === 0) return;

    try {
      // Find each notification node and update read: true
      const notifRef = ref(rtdb, "notifications");
      onValue(notifRef, async (snapshot) => {
        if (snapshot.exists()) {
          const raw = snapshot.val();
          Object.keys(raw).forEach(async (key) => {
            if (raw[key].userId === currentUser.uid) {
              await set(ref(rtdb, `notifications/${key}/read`), true);
            }
          });
        }
      }, { onlyOnce: true });
    } catch (err) {
      console.error("Error clearing notifications: ", err);
    }
  };

  const handleClearAll = async () => {
    if (!currentUser || notifications.length === 0) return;

    if (confirm(lang === "en" ? "Clear all notifications?" : "کیا آپ تمام اطلاعات کو صاف کرنا چاہتے ہیں؟")) {
      try {
        const notifRef = ref(rtdb, "notifications");
        onValue(notifRef, async (snapshot) => {
          if (snapshot.exists()) {
            const raw = snapshot.val();
            Object.keys(raw).forEach(async (key) => {
              if (raw[key].userId === currentUser.uid) {
                await remove(ref(rtdb, `notifications/${key}`));
              }
            });
          }
        }, { onlyOnce: true });
      } catch (err) {
        console.error("Error clearing notifications: ", err);
      }
    }
  };

  if (!currentUser) return null;

  return (
    <div id="notifications-inbox-wrapper" className="relative">
      
      {/* Dynamic bell alarm */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-slate-50 border hover:bg-slate-100 text-slate-700 cursor-pointer flex items-center justify-center transition-transform hover:scale-105"
      >
        <Bell className={`w-5 h-5 ${unreadCount > 0 ? "text-amber-500 animate-swing" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white px-1 shadow animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Pop up dropdown overlay block */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
          
          {/* Header Panel */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
            <div className="flex items-center gap-1.5 font-extrabold text-slate-800 text-sm">
              <Bell className="w-4 h-4 text-[#00A86B]" />
              <span>{getTranslation("notifications", lang)}</span>
            </div>
            
            {notifications.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllRead}
                  title="Mark all as read"
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-200 hover:text-emerald-700 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={handleClearAll}
                  title="Clear all history"
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-200 hover:text-rose-600 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Body Content list */}
          <div className="p-3 max-h-[300px] overflow-y-auto divide-y divide-slate-50 pr-1">
            {notifications.length === 0 ? (
              <div className="text-center py-10 text-slate-400 flex flex-col items-center justify-center gap-2">
                <BellOff className="w-8 h-8 text-slate-300" />
                <span className="text-xs">{getTranslation("noNotifications", lang)}</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-3 text-xs leading-relaxed transition-colors flex flex-col gap-1 rounded-lg ${
                    notif.read ? "bg-white text-slate-600" : "bg-emerald-50/25 text-slate-800 font-semibold"
                  }`}
                >
                  <p className="margin-0 text-left text-justify select-none">{notif.message}</p>
                  <span className="text-[9px] text-slate-400 font-mono text-left block">
                    <Calendar className="w-2.5 h-2.5 inline mr-1" />
                    {new Date(notif.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>

        </div>
      )}

    </div>
  );
}
