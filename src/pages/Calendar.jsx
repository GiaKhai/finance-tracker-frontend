import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Camera,
  Trash2,
  X,
  ArrowUp,
  ArrowDown,
  Receipt,
  Images,
} from "lucide-react";
import { transactionService } from "../services/transactionService";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function Calendar() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [transactions, setTransactions] = useState([]);
  const [photosByDate, setPhotosByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [transRes, photosRes] = await Promise.all([
        transactionService.getAllTransactions({
          month: currentMonth + 1,
          year: currentYear,
        }),
        transactionService.getPhotosByDate({
          start_date: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`,
          end_date: `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${new Date(currentYear, currentMonth + 1, 0).getDate()}`,
        }),
      ]);

      console.log("API Response - transactions:", transRes);
      console.log("API Response - photos:", photosRes);

      setTransactions(transRes.transactions || []);

      const photosMap = {};
      if (photosRes.photos) {
        console.log("Raw photos data:", JSON.stringify(photosRes.photos, null, 2));
        photosRes.photos.forEach((group) => {
          // Normalize date key to YYYY-MM-DD
          let dateKey = group.date ? String(group.date).trim() : null;
          if (dateKey && dateKey.includes("T")) {
            dateKey = dateKey.split("T")[0];
          }
          if (dateKey) {
            photosMap[dateKey] = group.photos || [];
            console.log(`Mapped: "${dateKey}" -> ${photosMap[dateKey].length} photos`);
          }
        });
        console.log("Photos map keys:", Object.keys(photosMap));
      } else {
        console.log("No photos in response");
      }
      setPhotosByDate(photosMap);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, currentYear]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getDaysInMonth = (month, year) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay();

  const getDayData = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayTransactions = transactions.filter((t) => {
      const tDate = new Date(t.transaction_date);
      return (
        tDate.getDate() === day &&
        tDate.getMonth() === currentMonth &&
        tDate.getFullYear() === currentYear
      );
    });

    const income = dayTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const expense = dayTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const photos = photosByDate[dateStr] || [];

    return { income, expense, transactions: dayTransactions, photos, dateStr };
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const handleFileUpload = async (e, dateStr) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await transactionService.uploadImage(formData);
      const photoUrl = uploadRes.url;

      await transactionService.uploadTransactionPhoto({
        photo_url: photoUrl,
        date: dateStr,
      });

      fetchData();
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId) => {
    if (!confirm("Delete this photo?")) return;
    try {
      await transactionService.deletePhoto(photoId);
      fetchData();
      if (selectedPhoto?.id === photoId) {
        setShowPhotoModal(false);
      }
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayData = getDayData(day);

      const isToday =
        day === new Date().getDate() &&
        currentMonth === new Date().getMonth() &&
        currentYear === new Date().getFullYear();

      let dayBgClass = "bg-muted/50 border border-muted/80";
      let dayTextClass = "text-foreground/70 group-hover:text-foreground";
      if (dayData.income > 0 || dayData.expense > 0) {
        if (dayData.income >= dayData.expense) {
          dayBgClass = "bg-income-bg";
          dayTextClass = "text-foreground";
        } else {
          dayBgClass = "bg-expense-bg";
          dayTextClass = "text-foreground";
        }
      }

      cells.push(
        <div
          key={day}
          className={`calendar-day ${dayBgClass} ${isToday ? "ring-2 ring-accent" : ""}`}
          onClick={() => {
            setSelectedDay({ day, dateStr, ...dayData });
            setShowDayModal(true);
          }}
        >
          <span
            className={`day-number ${isToday ? "text-accent font-extrabold" : dayTextClass}`}
          >
            {day}
          </span>

          {dayData.photos.length > 0 && (
            <div
              className="photo-thumbnails"
              onClick={(e) => e.stopPropagation()}
            >
              {dayData.photos.slice(0, 3).map((photo, idx) => (
                <img
                  key={photo.id || idx}
                  src={photo.photo_url}
                  alt=""
                  className="photo-thumb"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPhoto({ photos: dayData.photos, index: idx });
                    setShowPhotoModal(true);
                  }}
                />
              ))}
              {dayData.photos.length > 3 && (
                <span className="photo-count-overlay">
                  +{dayData.photos.length - 3}
                </span>
              )}
            </div>
          )}

          {(dayData.income > 0 || dayData.expense > 0) && (
            <div className="day-amounts">
              {dayData.income > 0 && (
                <span className="text-income text-[10px] font-semibold">
                  +{formatCurrency(dayData.income)}
                </span>
              )}
              {dayData.expense > 0 && (
                <span className="text-expense text-[10px] font-semibold">
                  -{formatCurrency(dayData.expense)}
                </span>
              )}
            </div>
          )}
        </div>,
      );
    }

    return cells;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header - matches mobile accent green header */}
      <div className="bg-accent px-6 pt-4 pb-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-white">Calendar</h1>
          <button
            onClick={() => {
              setCurrentMonth(new Date().getMonth());
              setCurrentYear(new Date().getFullYear());
            }}
            className="flex items-center gap-1.5 bg-white/20 px-3 py-1.5 rounded-lg text-sm font-semibold text-white hover:bg-white/30 transition"
          >
            <CalendarIcon size={16} />
            Today
          </button>
        </div>
      </div>

      {/* Month Selector Card */}
      <div className="bg-card shadow-sm">
        <div className="flex items-center justify-center gap-4 p-4">
          <button
            onClick={prevMonth}
            className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center hover:bg-primary/20 dark:hover:bg-primary/30 transition"
          >
            <ChevronLeft size={20} className="text-accent" />
          </button>
          <h2 className="text-lg font-bold text-foreground min-w-[180px] text-center">
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={nextMonth}
            className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center hover:bg-primary/20 dark:hover:bg-primary/30 transition"
          >
            <ChevronRight size={20} className="text-accent" />
          </button>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 pb-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-income-bg" />
            <span>Income &ge; Expense</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-expense-bg" />
            <span>Expense &gt; Income</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-accent" />
        </div>
      ) : (
        <div className="p-4 bg-card">
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_OF_WEEK.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-semibold text-muted-foreground/60 py-2"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
        </div>
      )}

      {/* Day Detail Modal - matches mobile bottom sheet style */}
      {showDayModal && selectedDay && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
          onClick={() => setShowDayModal(false)}
        >
          <div
            className="bg-card rounded-t-[28px] sm:rounded-2xl w-full sm:max-w-lg max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-card px-5 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-bold text-foreground">
                {new Date(selectedDay.dateStr).toLocaleDateString("en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <button
                onClick={() => setShowDayModal(false)}
                className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition"
              >
                <X size={18} className="text-muted-foreground" />
              </button>
            </div>

            <div className="p-5">
              {/* Income/Expense Summary */}
              <div className="flex gap-6 mb-6">
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 rounded-full bg-income-bg flex items-center justify-center mx-auto mb-2">
                    <ArrowUp size={18} className="text-income" />
                  </div>
                  <p className="text-xs text-muted-foreground">Income</p>
                  <p className="text-sm font-bold text-income">
                    {formatCurrency(selectedDay.income)}
                  </p>
                </div>
                <div className="w-px bg-border" />
                <div className="flex-1 text-center">
                  <div className="w-10 h-10 rounded-full bg-expense-bg flex items-center justify-center mx-auto mb-2">
                    <ArrowDown size={18} className="text-expense" />
                  </div>
                  <p className="text-xs text-muted-foreground">Expense</p>
                  <p className="text-sm font-bold text-expense">
                    {formatCurrency(selectedDay.expense)}
                  </p>
                </div>
              </div>

              {/* Photos Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-foreground">Photos</h4>
                  <div className="flex items-center gap-2">
                    <label className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/30 transition">
                      <Images size={18} className="text-accent" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, selectedDay.dateStr)
                        }
                        disabled={uploading}
                      />
                    </label>
                    <label className="w-9 h-9 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center cursor-pointer hover:bg-primary/20 dark:hover:bg-primary/30 transition">
                      <Camera size={18} className="text-accent" />
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) =>
                          handleFileUpload(e, selectedDay.dateStr)
                        }
                        disabled={uploading}
                      />
                    </label>
                  </div>
                </div>

                {selectedDay.photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2.5">
                    {selectedDay.photos.map((photo, idx) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.photo_url}
                          alt=""
                          className="w-full aspect-square rounded-xl object-cover cursor-pointer"
                          onClick={() => {
                            setSelectedPhoto({
                              photos: selectedDay.photos,
                              index: idx,
                            });
                            setShowPhotoModal(true);
                          }}
                        />
                        <button
                          onClick={() => handleDeletePhoto(photo.id)}
                          className="absolute top-1 right-1 w-6 h-6 bg-card/90 rounded-full flex items-center justify-center shadow opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={14} className="text-expense" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-accent transition bg-background">
                    <Camera size={24} className="text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Tap to add photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, selectedDay.dateStr)}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              {/* Transactions Section */}
              <div>
                <h4 className="font-semibold text-foreground mb-3">
                  Transactions
                </h4>
                {selectedDay.transactions.length > 0 ? (
                  <div className="space-y-0">
                    {selectedDay.transactions.map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center gap-3 py-3 border-b border-border last:border-b-0"
                      >
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center ${t.type === "INCOME" ? "bg-income-bg" : "bg-expense-bg"}`}
                        >
                          {t.type === "INCOME" ? (
                            <ArrowUp size={16} className="text-income" />
                          ) : (
                            <ArrowDown size={16} className="text-expense" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            {t.category_name || t.type}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.wallet_name}
                          </p>
                        </div>
                        <p
                          className={`text-sm font-bold ${t.type === "INCOME" ? "text-income" : "text-expense"}`}
                        >
                          {t.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(t.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                      <Receipt size={28} className="text-muted-foreground/60" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No transactions
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {showPhotoModal && selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-50"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="relative max-w-5xl w-full px-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowPhotoModal(false)}
              className="absolute -top-12 right-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
            >
              <X size={24} className="text-white" />
            </button>

            {selectedPhoto.index > 0 && (
              <button
                onClick={() =>
                  setSelectedPhoto({
                    ...selectedPhoto,
                    index: selectedPhoto.index - 1,
                  })
                }
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
            )}

            <img
              src={selectedPhoto.photos[selectedPhoto.index].photo_url}
              alt=""
              className="w-full max-h-[80vh] object-contain rounded-lg"
            />

            {selectedPhoto.index < selectedPhoto.photos.length - 1 && (
              <button
                onClick={() =>
                  setSelectedPhoto({
                    ...selectedPhoto,
                    index: selectedPhoto.index + 1,
                  })
                }
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
              >
                <ChevronRight size={24} className="text-white" />
              </button>
            )}

            {selectedPhoto.photos.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {selectedPhoto.photos.map((photo, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      setSelectedPhoto({ ...selectedPhoto, index: idx })
                    }
                    className={`rounded-full transition overflow-hidden ${idx === selectedPhoto.index ? "ring-2 ring-white w-12 h-12" : "w-8 h-8 opacity-60 hover:opacity-100"}`}
                  >
                    <img
                      src={photo.photo_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() =>
                handleDeletePhoto(selectedPhoto.photos[selectedPhoto.index].id)
              }
              className="absolute -top-12 left-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition"
            >
              <Trash2 size={20} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
