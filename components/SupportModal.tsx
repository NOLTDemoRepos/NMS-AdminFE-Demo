import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SupportModal: React.FC<SupportModalProps> = ({ isOpen, onClose }) => {
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) return;
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setTicketSubject('');
      setTicketMessage('');
      onClose();
    }, 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-slate-800 rounded-[32px] shadow-2xl max-w-xl w-full overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-blue-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-lg">
                  <span className="material-symbols-outlined text-2xl font-black">support_agent</span>
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight">Need Help? We're Here!</h3>
                  <p className="text-blue-100 text-xs font-medium mt-0.5">NOLT Staff Loan Support Desk</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {isSubmitted ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce">
                  <span className="material-symbols-outlined text-3xl font-black">check_circle</span>
                </div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Support Ticket Submitted!</h4>
                <p className="text-slate-500 text-xs font-bold max-w-xs">Our customer experience officer will reach out to you within 30 minutes.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black">
                      <span className="material-symbols-outlined text-lg">call</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">HOTLINE</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">+234 800 NOLT HELP</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
                      <span className="material-symbols-outlined text-lg">mail</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase text-slate-400 block">EMAIL SUPPORT</span>
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">support@nolt.finance</span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Subject / Enquiry Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Loan Repayment Inquiry / Rate Clarification"
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Message Details</label>
                    <textarea
                      required
                      rows={4}
                      placeholder="Describe your issue or question in detail..."
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-1 focus:ring-primary focus:outline-none resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-primary hover:bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    <span>Submit Support Ticket</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SupportModal;
