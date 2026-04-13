import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Info, AlertTriangle, ExternalLink } from 'lucide-react';
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { Notification } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationBellProps {
  userId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
      setNotifications(docs);
      setUnreadCount(docs.filter(n => !n.read).length);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.filter(n => !n.read).forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });
    try {
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'STATUS_CHANGE': return <Info className="w-4 h-4 text-blue-500" />;
      case 'REJECTION': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'HEALTH_GOAL': return <Check className="w-4 h-4 text-green-500" />;
      default: return <Info className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all group"
      >
        <Bell className="w-5 h-5 text-slate-600 group-hover:text-litcBlue group-hover:scale-110 transition-all" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-litcOrange text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100]"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute left-0 mt-3 w-[320px] sm:w-[380px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 z-[101] overflow-hidden"
            >
              <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="font-black text-slate-800 text-sm">التنبيهات</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Notifications</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] font-black text-litcBlue hover:text-litcDark transition-colors"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>

              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-4 border-b border-slate-50 flex gap-4 transition-colors cursor-pointer hover:bg-slate-50 ${!n.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        n.type === 'REJECTION' ? 'bg-red-50' : 
                        n.type === 'HEALTH_GOAL' ? 'bg-green-50' : 'bg-blue-50'
                      }`}>
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-xs font-black truncate ${!n.read ? 'text-slate-900' : 'text-slate-500'}`}>
                            {n.title}
                          </h4>
                          <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap mr-2">
                            {new Date(n.createdAt).toLocaleTimeString('ar-LY', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 leading-relaxed line-clamp-2">
                          {n.message}
                        </p>
                        {n.link && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] font-black text-litcBlue">
                            <span>عرض التفاصيل</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell className="w-8 h-8 text-slate-200" />
                    </div>
                    <p className="text-xs font-bold text-slate-400">لا توجد تنبيهات حالياً</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-slate-50/50 text-center">
                <button className="text-[10px] font-black text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                  عرض كل التنبيهات
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
