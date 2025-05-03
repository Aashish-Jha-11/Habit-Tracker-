"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts"
import { motion, AnimatePresence } from "framer-motion"
import { format, subDays, parseISO } from "date-fns"
import { memo } from 'react'

interface LogData {
  date: string;
  water: number;
  sleep: number;
  screen: number;
  mood: number;
  exercise: number;
  meditation: number;
}

interface CalendarData {
  date: string;
  logged: boolean;
}

interface NavButtonProps {
  id: string;
  label: string;
  activeView: string;
  setActiveView: (view: string) => void;
}

interface MobileNavButtonProps extends NavButtonProps {
  setNavbarOpen: (open: boolean) => void;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  goal: string | number;
  percentage: number;
  icon: React.ReactNode;
  color: 'blue' | 'indigo' | 'purple' | 'green' | 'yellow' | 'red' | 'amber';
  isReversed?: boolean;
}

interface HabitSliderProps {
  title: string;
  value: number;
  setValue: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  goal: number;
  icon: React.ReactNode;
  isLowerBetter?: boolean;
  customDisplay?: (value: number) => string;
}

const HabitTracker = () => {
  const [activeView, setActiveView] = useState('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [waterIntake, setWaterIntake] = useState(4);
  const [sleepHours, setSleepHours] = useState(7);
  const [screenTime, setScreenTime] = useState(4);
  const [mood, setMood] = useState(3);
  const [exercise, setExercise] = useState(30);
  const [meditation, setMeditation] = useState(5);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [waterGoal, setWaterGoal] = useState(8);
  const [sleepGoal, setSleepGoal] = useState(8);
  const [screenTimeGoal, setScreenTimeGoal] = useState(3);
  const [exerciseGoal, setExerciseGoal] = useState(45);
  const [meditationGoal, setMeditationGoal] = useState(10);
  const [userName, setUserName] = useState('Alex Johnson');
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const settingsRef = useRef(null);


  const [historyData, setHistoryData] = useState(() => {
    const today = new Date();
    const generatePastData = () => {

      const seed = 42;
      const random = (min: number, max: number) => {
        const x = Math.sin(seed) * 10000;
        return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
      };

      return Array.from({ length: 30 }).map((_, i) => {
        const date = new Date(today);
        date.setDate(date.getDate() - (29 - i));
        const formattedDate = format(date, 'yyyy-MM-dd');
        const isLogged = i % 3 !== 0;
        return {
          date: formattedDate,
          water: isLogged ? random(5, 10) : 0,
          sleep: isLogged ? random(6, 9) : 0,
          screen: isLogged ? random(2, 5) : 0,
          mood: isLogged ? random(3, 5) : 0,
          exercise: isLogged ? random(30, 60) : 0,
          meditation: isLogged ? random(5, 15) : 0,
        };
      });
    };

    return generatePastData();
  });


  const [calendarData, setCalendarData] = useState(() => {
    const today = new Date();
    const last30Days = Array.from({ length: 30 }).map((_, i) => {
      const date = subDays(today, 29 - i);
      const formattedDate = format(date, 'yyyy-MM-dd');
      return {
        date: formattedDate,
        logged: Math.random() > 0.3 || i >= 25, 
      };
    });
    return last30Days;
  });


  useEffect(() => {
    // Close settings menu when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsRef]);

  useEffect(() => {

    const today = format(new Date(), 'yyyy-MM-dd');
    const updatedHistory = historyData.map(item => 
      item.date === today ? {
        ...item,
        water: waterIntake,
        sleep: sleepHours,
        screen: screenTime,
        mood: mood,
        exercise: exercise,
        meditation: meditation
      } : item
    );
    setHistoryData(updatedHistory);
  }, [waterIntake, sleepHours, screenTime, mood, exercise, meditation]);


  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.className = theme === 'dark' 
      ? 'bg-gray-900 text-white transition-colors duration-200' 
      : 'bg-gray-50 text-gray-900 transition-colors duration-200';
  }, [theme]);


  const calculateStreak = useCallback((logs: LogData[]) => {
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    

    const sortedLogs = [...logs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    

    for (let i = 0; i < sortedLogs.length; i++) {
      const log = sortedLogs[i];
      const isLogged = log.water > 0 || log.sleep > 0 || log.screen > 0 || 
                      log.mood > 0 || log.exercise > 0 || log.meditation > 0;
      
      if (isLogged) {
        tempStreak++;
        if (i === sortedLogs.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 0;
      }
    }
    
    longestStreak = Math.max(longestStreak, tempStreak);
    
    return { currentStreak, longestStreak };
  }, []);


  const calculateCompletionRate = useCallback((logs: LogData[]) => {
    const totalDays = logs.length;
    const completedDays = logs.filter(log => 
      log.water >= waterGoal &&
      log.sleep >= sleepGoal &&
      log.exercise >= exerciseGoal &&
      log.meditation >= meditationGoal &&
      log.screen <= screenTimeGoal
    ).length;
    
    return Math.round((completedDays / totalDays) * 100);
  }, [waterGoal, sleepGoal, exerciseGoal, meditationGoal, screenTimeGoal]);


  useEffect(() => {
    const { currentStreak: newCurrentStreak } = calculateStreak(historyData);
    setCurrentStreak(newCurrentStreak);
  }, [historyData, calculateStreak]);

  // ================ EVENT HANDLERS ================
  const handleCheckIn = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const updatedCalendar = calendarData.map(day => 
      day.date === today ? { ...day, logged: true } : day
    );
    setCalendarData(updatedCalendar);
    
    const todayExists = historyData.some(item => item.date === today);
    
    if (!todayExists) {
      const newData = [
        ...historyData,
        {
          date: today,
          water: waterIntake,
          sleep: sleepHours,
          screen: screenTime,
          mood: mood,
          exercise: exercise,
          meditation: meditation
        }
      ];
      setHistoryData(newData);
    }
    

    alert("Daily habits logged successfully!");
    setActiveView('home');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const calculateCompletionPercentage = (value: number, goal: number) => {
    return Math.min(100, Math.round((value / goal) * 100));
  };

  const getTodayCompletionPercentage = () => {
    const waterPercentage = calculateCompletionPercentage(waterIntake, waterGoal);
    const sleepPercentage = calculateCompletionPercentage(sleepHours, sleepGoal);
    const screenPercentage = 100 - calculateCompletionPercentage(screenTime, screenTimeGoal);
    const exercisePercentage = calculateCompletionPercentage(exercise, exerciseGoal);
    const meditationPercentage = calculateCompletionPercentage(meditation, meditationGoal);
    
    const totalPercentage = (waterPercentage + sleepPercentage + screenPercentage + exercisePercentage + meditationPercentage) / 5;
    return Math.round(totalPercentage);
  };

  
  const Header = memo(() => {
    const handleProfileClick = useCallback(() => {
      setIsSettingsOpen(!isSettingsOpen);
    }, [isSettingsOpen]);

    const handleThemeToggle = useCallback(() => {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [theme]);

    return (
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-md transition-colors duration-200">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <motion.div 
              className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-500 rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ 
                scale: 1,
                opacity: 1,
                transition: {
                  duration: 0.5,
                  delay: 0.2
                }
              }}
              whileHover={{ 
                scale: [1, 1.2, 1.2, 1.2, 1],
                rotate: [0, 10, -10, 10, 0],
                transition: { 
                  duration: 0.8,
                  repeat: 0
                }
              }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <motion.span 
                className="text-white font-bold text-xl z-10"
                whileHover={{ 
                  scale: [1, 1.3, 1.3, 1.3, 1],
                  transition: { 
                    duration: 0.8,
                    repeat: 0
                  }
                }}
              >
                H
              </motion.span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-500 dark:from-indigo-400 dark:to-purple-400 opacity-0"
                whileHover={{ 
                  opacity: [0, 0.7, 0.7, 0.7, 0],
                  scale: [1, 1.5, 1.5, 1.5, 1],
                  transition: { 
                    duration: 0.8,
                    repeat: 0
                  }
                }}
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-500 to-indigo-600 dark:from-purple-400 dark:to-indigo-500"
                whileHover={{ 
                  opacity: [1, 0, 0, 0, 1],
                  scale: [1, 1.5, 1.5, 1.5, 1],
                  transition: { 
                    duration: 0.8,
                    repeat: 0
                  }
                }}
              />
            </motion.div>
            <motion.h1 
              className="text-xl font-bold text-gray-800 dark:text-white cursor-pointer"
              initial={{ x: -10, opacity: 0 }}
              animate={{ 
                x: 0,
                opacity: 1,
                transition: {
                  duration: 0.5,
                  delay: 0.3
                }
              }}
              whileHover={{ 
                x: [0, 5, -5, 5, 0],
                transition: { 
                  duration: 0.8,
                  repeat: 0
                }
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <motion.span
                className="inline-block"
                initial={{ color: "#1f2937" }}
                animate={{ 
                  color: ["#1f2937", "#4f46e5", "#1f2937"],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                whileHover={{ 
                  scale: 1.1,
                  transition: { 
                    duration: 0.3
                  }
                }}
              >
                Habit
              </motion.span>
              <motion.span
                className="inline-block"
                initial={{ color: "#4f46e5" }}
                animate={{ 
                  color: ["#4f46e5", "#1f2937", "#4f46e5"],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                whileHover={{ 
                  scale: 1.1,
                  transition: { 
                    duration: 0.3
                  }
                }}
              >
                Nexus
              </motion.span>
            </motion.h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-4">
            <NavButton id="home" label="Dashboard" activeView={activeView} setActiveView={setActiveView} />
            <NavButton id="check-in" label="Check-in" activeView={activeView} setActiveView={setActiveView} />
            <NavButton id="streak" label="Streaks" activeView={activeView} setActiveView={setActiveView} />
            <NavButton id="analytics" label="Analytics" activeView={activeView} setActiveView={setActiveView} />
            
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <div className="relative ml-2" ref={settingsRef}>
              <button 
                onClick={handleProfileClick}
                className="flex items-center space-x-2 px-3 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <img 
                  src="https://randomuser.me/api/portraits/men/42.jpg" 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full border-2 border-indigo-100 dark:border-indigo-900"
                />
                <span className="font-medium text-gray-700 dark:text-gray-200">{userName.split(' ')[0]}</span>
              </button>
              
              {isSettingsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
                >
                  <button 
                    onClick={() => {
                      setActiveView('settings');
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center space-x-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-800 dark:text-gray-200">Settings</span>
                  </button>
                  <hr className="my-1 border-gray-200 dark:border-gray-700" />
                  <div className="px-4 py-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Signed in as</p>
                    <p className="font-medium text-gray-800 dark:text-gray-200">{userName}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </nav>
          

          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            <button 
              className="text-gray-700 dark:text-gray-200 focus:outline-none"
              onClick={() => setNavbarOpen(!navbarOpen)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        

        <AnimatePresence>
          {navbarOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-white dark:bg-gray-800 shadow-lg overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                <MobileNavButton id="home" label="Dashboard" activeView={activeView} setActiveView={setActiveView} setNavbarOpen={setNavbarOpen} />
                <MobileNavButton id="check-in" label="Check-in" activeView={activeView} setActiveView={setActiveView} setNavbarOpen={setNavbarOpen} />
                <MobileNavButton id="streak" label="Streaks" activeView={activeView} setActiveView={setActiveView} setNavbarOpen={setNavbarOpen} />
                <MobileNavButton id="analytics" label="Analytics" activeView={activeView} setActiveView={setActiveView} setNavbarOpen={setNavbarOpen} />
                <MobileNavButton id="settings" label="Settings" activeView={activeView} setActiveView={setActiveView} setNavbarOpen={setNavbarOpen} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    );
  });


  const NavButton = memo(({ id, label, activeView, setActiveView }: NavButtonProps) => (
    <motion.button
      onClick={() => setActiveView(id)}
      className={`px-4 py-2 rounded-md font-medium transition-colors ${
        activeView === id 
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
      whileHover={{ 
        scale: 1.05,
        y: -2,
        transition: { type: "spring", stiffness: 300 }
      }}
      whileTap={{ scale: 0.95 }}
      animate={{
        backgroundColor: activeView === id 
          ? 'rgb(238, 242, 255)' 
          : 'transparent'
      }}
    >
      {label}
    </motion.button>
  ));


  const MobileNavButton = memo(({ id, label, activeView, setActiveView, setNavbarOpen }: MobileNavButtonProps) => (
    <motion.button
      onClick={() => {
        setActiveView(id);
        setNavbarOpen(false);
      }}
      className={`w-full text-left px-3 py-3 rounded-md font-medium ${
        activeView === id 
          ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' 
          : 'text-gray-600 dark:text-gray-300'
      }`}
      whileTap={{ scale: 0.98 }}
    >
      {label}
    </motion.button>
  ));


  const HomeView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Welcome back, {userName.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Here's your habit summary for today
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <SummaryCard 
          title="Water Intake" 
          value={`${waterIntake} glasses`} 
          goal={`${waterGoal} glasses`}
          percentage={calculateCompletionPercentage(waterIntake, waterGoal)}
          icon={
            <svg className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v3M19 5l-3 3M22 12h-3M19 19l-3-3M12 22v-3M5 19l3-3M2 12h3M5 5l3 3"></path>
              <circle cx="12" cy="12" r="4"></circle>
            </svg>
          }
          color="blue"
        />
        <SummaryCard 
          title="Sleep" 
          value={`${sleepHours} hours`} 
          goal={`${sleepGoal} hours`}
          percentage={calculateCompletionPercentage(sleepHours, sleepGoal)}
          icon={
            <svg className="h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4zM12 12v12M4.93 19.07A10 10 0 0 1 1 12C1 5.92 5.92 1 12 1"></path>
            </svg>
          }
          color="indigo"
        />
        <SummaryCard 
          title="Screen Time" 
          value={`${screenTime} hours`} 
          goal={`${screenTimeGoal} hours`}
          percentage={100 - calculateCompletionPercentage(screenTime, screenTimeGoal)}
          isReversed={true}
          icon={
            <svg className="h-6 w-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          }
          color="purple"
        />
        <SummaryCard 
          title="Mood" 
          value={`${mood}/5`} 
          goal="5/5"
          percentage={(mood / 5) * 100}
          icon={
            <svg className="h-6 w-6 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d={mood >= 3 ? "M8 14s1.5 2 4 2 4-2 4-2" : "M8 15h8M9 9h.01M15 9h.01"}></path>
              <line x1="9" y1="9" x2="9.01" y2="9"></line>
              <line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          }
          color="yellow"
        />
        <SummaryCard 
          title="Exercise" 
          value={`${exercise} min`} 
          goal={`${exerciseGoal} min`}
          percentage={calculateCompletionPercentage(exercise, exerciseGoal)}
          icon={
            <svg className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
              <line x1="6" y1="1" x2="6" y2="4"></line>
              <line x1="10" y1="1" x2="10" y2="4"></line>
              <line x1="14" y1="1" x2="14" y2="4"></line>
            </svg>
          }
          color="green"
        />
        <SummaryCard 
          title="Meditation" 
          value={`${meditation} min`} 
          goal={`${meditationGoal} min`}
          percentage={calculateCompletionPercentage(meditation, meditationGoal)}
          icon={
            <svg className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          }
          color="amber"
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Activity</h2>
          <div className="flex items-center space-x-2">
            <span className="text-gray-600 dark:text-gray-300 text-sm">Today's Completion:</span>
            <div className="flex items-center">
              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full"
                  style={{ width: `${getTodayCompletionPercentage()}%` }}
                ></div>
              </div>
              <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-medium">{getTodayCompletionPercentage()}%</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={historyData.slice(-7)}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
            <XAxis 
              dataKey="date" 
              tickFormatter={(dateStr) => {
                try {
                  return format(parseISO(dateStr), 'MMM d');
                } catch (e) {
                  console.error("Date parsing error:", e);
                  return "";
                }
              }}
            />
            <YAxis domain={[0, 'auto']} stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <Tooltip 
              labelFormatter={(dateStr) => {
                try {
                  return format(parseISO(dateStr), 'MMM d, yyyy');
                } catch (e) {
                  console.error("Tooltip date parsing error:", e);
                  return "Invalid date";
                }
              }} 
              contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : 'white', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
            />
            <Legend />
            <Line type="monotone" dataKey="water" stroke="#3b82f6" name="Water (glasses)" />
            <Line type="monotone" dataKey="sleep" stroke="#6366f1" name="Sleep (hours)" />
            <Line type="monotone" dataKey="mood" stroke="#f59e0b" name="Mood (1-5)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );


  const SummaryCard = ({ title, value, goal, percentage, icon, color, isReversed = false }: SummaryCardProps) => {
    const colorClasses: Record<SummaryCardProps['color'], string> = {
      blue: 'from-blue-50 to-blue-100 text-blue-800 dark:from-blue-900/20 dark:to-blue-800/20 dark:text-blue-300',
      indigo: 'from-indigo-50 to-indigo-100 text-indigo-800 dark:from-indigo-900/20 dark:to-indigo-800/20 dark:text-indigo-300',
      purple: 'from-purple-50 to-purple-100 text-purple-800 dark:from-purple-900/20 dark:to-purple-800/20 dark:text-purple-300',
      green: 'from-green-50 to-green-100 text-green-800 dark:from-green-900/20 dark:to-green-800/20 dark:text-green-300',
      yellow: 'from-yellow-50 to-yellow-100 text-yellow-800 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:text-yellow-300',
      red: 'from-red-50 to-red-100 text-red-800 dark:from-red-900/20 dark:to-red-800/20 dark:text-red-300',
      amber: 'from-amber-50 to-amber-100 text-amber-800 dark:from-amber-900/20 dark:to-amber-800/20 dark:text-amber-300',
    };
    
    const barColors: Record<SummaryCardProps['color'], string> = {
      blue: 'bg-blue-500 dark:bg-blue-400',
      indigo: 'bg-indigo-500 dark:bg-indigo-400',
      purple: 'bg-purple-500 dark:bg-purple-400',
      green: 'bg-green-500 dark:bg-green-400',
      yellow: 'bg-yellow-500 dark:bg-yellow-400',
      red: 'bg-red-500 dark:bg-red-400',
      amber: 'bg-amber-500 dark:bg-amber-400',
    };
    
    return (
      <motion.div 
        className={`bg-gradient-to-br ${colorClasses[color]} p-6 rounded-xl shadow-md`}
        whileHover={{ 
          y: -5,
          scale: 1.02,
          transition: { 
            type: "spring",
            stiffness: 300,
            damping: 10
          }
        }}
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-2xl font-bold mt-1">{value}</p>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 bg-opacity-60 dark:bg-opacity-20 rounded-lg shadow-sm">
            {icon}
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm mb-1">
          <span>Goal: {goal}</span>
          <span className="font-medium">{isReversed ? 
            `${Math.max(0, 100 - percentage)}% below` : 
            `${percentage}%`}
          </span>
        </div>
        
        <div className="w-full bg-white dark:bg-gray-700 bg-opacity-50 dark:bg-opacity-30 rounded-full h-2.5">
          <motion.div 
            className={`h-2.5 rounded-full ${barColors[color]}`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, delay: 0.2 }}
          />
        </div>
      </motion.div>
    );
  };


  const CheckInView = memo(() => {
    const [customTime, setCustomTime] = useState('');
    const [showCustomTimeInput, setShowCustomTimeInput] = useState(false);
    const [selectedTime, setSelectedTime] = useState('');

    const handleCustomTime = useCallback(() => {
      setShowCustomTimeInput(true);
    }, []);

    const handleTimeSelect = useCallback((time: string) => {
      setSelectedTime(time);
      setShowCustomTimeInput(false);
      alert(`Reminder set for ${time}`);
    }, []);

    const handleCustomTimeSubmit = useCallback((e: React.FormEvent) => {
      e.preventDefault();
      if (customTime) {
        handleTimeSelect(customTime);
      }
    }, [customTime, handleTimeSelect]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Daily Check-in
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            How did you do today? Track your daily habits below
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <HabitSlider 
              title="Water Intake" 
              value={waterIntake}
              setValue={setWaterIntake}
              min={0}
              max={12}
              step={1}
              unit="glasses"
              goal={waterGoal}
              icon={
                <svg className="h-6 w-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v3M19 5l-3 3M22 12h-3M19 19l-3-3M12 22v-3M5 19l3-3M2 12h3M5 5l3 3"></path>
                  <circle cx="12" cy="12" r="4"></circle>
                </svg>
              }
            />
            
            <HabitSlider 
              title="Sleep" 
              value={sleepHours}
              setValue={setSleepHours}
              min={0}
              max={12}
              step={0.5}
              unit="hours"
              goal={sleepGoal}
              icon={
                <svg className="h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8c0 2.2-1.8 4-4 4s-4-1.8-4-4 1.8-4 4-4 4 1.8 4 4zM12 12v12M4.93 19.07A10 10 0 0 1 1 12C1 5.92 5.92 1 12 1"></path>
                </svg>
              }
            />
            
            <HabitSlider 
              title="Screen Time" 
              value={screenTime}
              setValue={setScreenTime}
              min={0}
              max={16}
              step={0.5}
              unit="hours"
              goal={screenTimeGoal}
              isLowerBetter={true}
              icon={
                <svg className="h-6 w-6 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
              }
            />
          </div>
          
          <div className="space-y-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
            <HabitSlider 
              title="Mood" 
              value={mood}
              setValue={setMood}
              min={1}
              max={5}
              step={1}
              unit=""
              goal={5}
              icon={
                <svg className="h-6 w-6 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d={mood >= 3 ? "M8 14s1.5 2 4 2 4-2 4-2" : "M8 15h8M9 9h.01M15 9h.01"}></path>
                  <line x1="9" y1="9" x2="9.01" y2="9"></line>
                  <line x1="15" y1="9" x2="15.01" y2="9"></line>
                </svg>
              }
              customDisplay={(val) => {
                const moodLabels = ["Very Bad", "Bad", "Okay", "Good", "Excellent"];
                return moodLabels[val-1];
              }}
            />
            
            <HabitSlider 
              title="Exercise" 
              value={exercise}
              setValue={setExercise}
              min={0}
              max={120}
              step={5}
              unit="minutes"
              goal={exerciseGoal}
              icon={
                <svg className="h-6 w-6 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                  <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path>
                  <line x1="6" y1="1" x2="6" y2="4"></line>
                  <line x1="10" y1="1" x2="10" y2="4"></line>
                  <line x1="14" y1="1" x2="14" y2="4"></line>
                </svg>
              }
            />
            
            <HabitSlider 
              title="Meditation" 
              value={meditation}
              setValue={setMeditation}
              min={0}
              max={60}
              step={5}
              unit="minutes"
              goal={meditationGoal}
              icon={
                <svg className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
              }
            />
            
            <div className="pt-6">
              <motion.button
                onClick={handleCheckIn}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-lg font-semibold rounded-lg shadow-md dark:from-indigo-600 dark:to-purple-600"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                Submit Daily Check-in
              </motion.button>
            </div>
          </div>
        </div>
        
        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">Set a reminder</h3>
              <p className="text-indigo-600 dark:text-indigo-400">Never miss a daily check-in</p>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => handleTimeSelect('8:00 PM')}
                className={`px-5 py-2 ${
                  selectedTime === '8:00 PM' 
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white' 
                    : 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
                } font-medium rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors`}
              >
                8:00 PM
              </button>
              <button 
                onClick={() => handleTimeSelect('9:00 PM')}
                className={`px-5 py-2 ${
                  selectedTime === '9:00 PM' 
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white' 
                    : 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300'
                } font-medium rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-700 transition-colors`}
              >
                9:00 PM
              </button>
              <button 
                onClick={handleCustomTime}
                className={`px-5 py-2 ${
                  selectedTime && !['8:00 PM', '9:00 PM'].includes(selectedTime)
                    ? 'bg-indigo-600 dark:bg-indigo-500 text-white' 
                    : 'bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-300'
                } font-medium rounded-md border border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors`}
              >
                Custom
              </button>
            </div>
          </div>

          {showCustomTimeInput && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <form onSubmit={handleCustomTimeSubmit} className="flex gap-2">
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="px-4 py-2 border border-indigo-200 dark:border-indigo-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                >
                  Set
                </button>
              </form>
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  });


  const HabitSlider = memo(({ 
    title, value, setValue, min, max, step, unit, goal, icon, 
    isLowerBetter = false, customDisplay = undefined 
  }: HabitSliderProps) => {
    const percentage = isLowerBetter 
      ? Math.max(0, 100 - ((value / goal) * 100)) 
      : Math.min(100, ((value / goal) * 100));
    
    const displayValue = customDisplay ? customDisplay(value) : (unit ? `${value} ${unit}` : value);
    
    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(Number.parseFloat(e.target.value));
    }, [setValue]);

    const getSliderBackground = useCallback(() => {
      if (title === 'Mood') {
        const moodColors = [
          'from-red-500 to-red-400',
          'from-red-400 to-orange-400',
          'from-orange-400 to-yellow-400',
          'from-yellow-400 to-green-400',
          'from-green-400 to-green-500'
        ];
        const colorIndex = Math.min(Math.floor((value - min) / ((max - min) / 5)), 4);
        return `bg-gradient-to-r ${moodColors[colorIndex]}`;
      }
      return isLowerBetter 
        ? `bg-gradient-to-r from-red-500 to-gray-200`
        : `bg-gradient-to-r from-indigo-500 to-gray-200`;
    }, [title, value, min, max, isLowerBetter]);

    const getProgressColor = useCallback(() => {
      if (title === 'Mood') {
        if (value <= 2) return 'bg-red-500';
        if (value <= 3) return 'bg-orange-500';
        if (value <= 4) return 'bg-yellow-500';
        return 'bg-green-500';
      }
      return isLowerBetter ? 'bg-red-500' : 'bg-indigo-500';
    }, [title, value, isLowerBetter]);

    return (
      <motion.div 
        className="space-y-4"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="flex justify-between items-center">
          <motion.div 
            className="flex items-center space-x-2"
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">{icon}</div>
            <h3 className="font-medium text-gray-800 dark:text-gray-200">{title}</h3>
          </motion.div>
          <motion.div 
            className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
            key={value}
          >
            {displayValue}
          </motion.div>
        </div>
        
        <div className="relative">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${getSliderBackground()}`}
            style={{
              backgroundSize: `${(value - min) / (max - min) * 100}% 100%`,
              backgroundRepeat: 'no-repeat'
            }}
          />
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{min} {unit}</span>
          <span>Goal: {goal} {unit}</span>
          <span>{max} {unit}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-600 dark:text-gray-400">Progress</span>
          <span className={`font-medium ${
            percentage >= 75 ? 'text-green-600 dark:text-green-400' : 
            percentage >= 50 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'
          }`}>{Math.round(percentage)}%</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <motion.div 
            className={`h-1.5 rounded-full ${getProgressColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${isLowerBetter ? 100 - (value / max * 100) : value / max * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </motion.div>
    );
  });


  const StreakView = memo(() => {
    const { currentStreak, longestStreak } = calculateStreak(historyData);
    const completionRate = calculateCompletionRate(historyData);
    const daysLogged = historyData.filter(log => 
      log.water > 0 || log.sleep > 0 || log.screen > 0 || 
      log.mood > 0 || log.exercise > 0 || log.meditation > 0
    ).length;

    const getLast30Days = () => {
      const today = new Date();
      const days = [];
      let currentMonth = '';
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const month = format(date, 'MMM');
        if (month !== currentMonth) {
          currentMonth = month;
          days.push({ type: 'month', value: month });
        }
        
        days.push({ type: 'day', value: date });
      }
      return days;
    };

    const last30Days = getLast30Days();

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Your Streaks
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Keep track of your consistency and build momentum
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Activity Calendar</h2>
            <div className="grid grid-cols-7 gap-2">

              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {day}
                </div>
              ))}
              

              {last30Days.map((item, idx) => {
                if (item.type === 'month') {
                  return (
                    <div 
                      key={`month-${idx}`}
                      className="col-span-7 text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 py-2"
                    >
                      {item.value}
                    </div>
                  );
                }

                const date = item.value as Date;
                const logEntry = historyData.find(log => {
                  const logDate = new Date(log.date);
                  return logDate.toDateString() === date.toDateString();
                });

                const isLogged = logEntry ? 
                  logEntry.water > 0 || logEntry.sleep > 0 || logEntry.screen > 0 || 
                  logEntry.mood > 0 || logEntry.exercise > 0 || logEntry.meditation > 0 : false;

                const isCompleted = logEntry ? 
                  logEntry.water >= waterGoal &&
                  logEntry.sleep >= sleepGoal &&
                  logEntry.exercise >= exerciseGoal &&
                  logEntry.meditation >= meditationGoal &&
                  logEntry.screen <= screenTimeGoal : false;

                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <motion.div 
                    key={date.toISOString()}
                    className={`aspect-square rounded-md flex items-center justify-center text-xs font-medium ${
                      isLogged 
                        ? (isCompleted 
                            ? 'bg-green-500 dark:bg-green-600 text-white' 
                            : 'bg-blue-500 dark:bg-blue-600 text-white')
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                    } ${isToday ? 'ring-2 ring-indigo-500 dark:ring-indigo-400' : ''}`}
                    whileHover={{ scale: 1.1 }}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2, delay: idx * 0.01 }}
                  >
                    {format(date, 'd')}
                  </motion.div>
                );
              })}
            </div>
            

            <div className="mt-4 flex items-center justify-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-green-500 dark:bg-green-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-blue-500 dark:bg-blue-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Logged</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-700"></div>
                <span className="text-gray-600 dark:text-gray-400">Not Logged</span>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Streak Stats</h2>
            
            <div className="space-y-6">
              <div className="text-center py-4">
                <div className="w-28 h-28 flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 mx-auto">
                  <div className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{currentStreak}</div>
                </div>
                <h3 className="mt-4 text-xl font-medium text-gray-800 dark:text-white">Current Streak</h3>
                <p className="text-gray-600 dark:text-gray-400">consecutive days</p>
              </div>
              
              <hr className="border-gray-200 dark:border-gray-700" />
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Longest Streak</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">{longestStreak} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Days Logged</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {daysLogged} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {completionRate}%
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Habit Performance</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historyData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(dateStr) => {
                    try {
                      return format(parseISO(dateStr), 'MMM d');
                    } catch (e) {
                      console.error("Bar chart X axis error:", e);
                      return "";
                    }
                  }}
                  stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                />
                <YAxis domain={[0, 'auto']} stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  labelFormatter={(dateStr) => {
                    try {
                      return format(parseISO(dateStr), 'MMM d, yyyy');
                    } catch (e) {
                      console.error("Bar chart tooltip error:", e);
                      return "Invalid date";
                    }
                  }}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : 'white', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
                />
                <Legend />
                <Bar dataKey="water" name="Water (glasses)" fill="#3b82f6" />
                <Bar dataKey="sleep" name="Sleep (hours)" fill="#6366f1" />
                <Bar dataKey="exercise" name="Exercise (min)" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>
    );
  });


  const AnalyticsView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="text-center md:text-left">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
          Habit Analytics
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Track your progress and see your trends over time
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div 
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Water Intake Trend</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(dateStr) => {
                    try {
                      return format(parseISO(dateStr), 'MMM d');
                    } catch (e) {
                      console.error("Water intake chart error:", e);
                      return "";
                    }
                  }}
                  stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                />
                <YAxis domain={[0, 'auto']} stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  labelFormatter={(dateStr) => {
                    try {
                      return format(parseISO(dateStr), 'MMM d, yyyy');
                    } catch (e) {
                      console.error("Water intake tooltip error:", e);
                      return "Invalid date";
                    }
                  }}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : 'white', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="water" 
                  name="Water (glasses)" 
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Sleep Tracking</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(dateStr) => {
                    try {
                      return format(parseISO(dateStr), 'MMM d');
                    } catch (e) {
                      console.error("Sleep chart error:", e);
                      return "";
                    }
                  }}
                  stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                />
                <YAxis domain={[0, 'auto']} stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  labelFormatter={(dateStr) => {
                    try {
                      return format(parseISO(dateStr), 'MMM d, yyyy');
                    } catch (e) {
                      console.error("Sleep tooltip error:", e);
                      return "Invalid date";
                    }
                  }}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : 'white', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sleep" 
                  name="Sleep (hours)" 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Exercise Minutes</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(dateStr) => {
                    try {
                      return format(parseISO(dateStr), 'MMM d');
                    } catch (e) {
                      console.error("Exercise chart error:", e);
                      return "";
                    }
                  }}
                  stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                />
                <YAxis domain={[0, 'auto']} stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  labelFormatter={(dateStr) => {
                    try {
                      return format(parseISO(dateStr), 'MMM d, yyyy');
                    } catch (e) {
                      console.error("Exercise tooltip error:", e);
                      return "Invalid date";
                    }
                  }}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : 'white', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="exercise" 
                  name="Exercise (minutes)" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        <motion.div 
          className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Meditation Minutes</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(dateStr) => {
                    try {
                      return format(parseISO(dateStr), 'MMM d');
                    } catch (e) {
                      console.error("Meditation chart error:", e);
                      return "";
                    }
                  }}
                  stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
                />
                <YAxis domain={[0, 'auto']} stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  labelFormatter={(dateStr) => {
                    try {
                      return format(parseISO(dateStr), 'MMM d, yyyy');
                    } catch (e) {
                      console.error("Meditation tooltip error:", e);
                      return "Invalid date";
                    }
                  }}
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : 'white', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="meditation" 
                  name="Meditation (minutes)" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                  dot={{ r: 4 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      
      <motion.div 
        className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Weekly Habit Overview</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={historyData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(dateStr) => {
                  try {
                    return format(parseISO(dateStr), 'E');
                  } catch (e) {
                    console.error("Weekly overview chart error:", e);
                    return "";
                  }
                }}
                stroke={theme === 'dark' ? '#9ca3af' : '#6b7280'}
              />
              <YAxis yAxisId="left" orientation="left" stroke="#6366f1" domain={[0, 'auto']} />
              <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" domain={[0, 'auto']} />
              <Tooltip 
                labelFormatter={(dateStr) => {
                  try {
                    return format(parseISO(dateStr), 'EEEE, MMM d');
                  } catch (e) {
                    console.error("Weekly overview tooltip error:", e);
                    return "Invalid date";
                  }
                }}
                contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : 'white', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="water" name="Water (glasses)" fill="#3b82f6" />
              <Bar yAxisId="left" dataKey="sleep" name="Sleep (hours)" fill="#6366f1" />
              <Bar yAxisId="right" dataKey="exercise" name="Exercise (min)" fill="#10b981" />
              <Bar yAxisId="left" dataKey="screen" name="Screen Time (hours)" fill="#8b5cf6" />
              <Bar yAxisId="right" dataKey="meditation" name="Meditation (min)" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );


  const SettingsView = memo(() => {
    const [localUserName, setLocalUserName] = useState(userName);
    const [localEmail, setLocalEmail] = useState("alex.johnson@example.com");
    const [localTimeZone, setLocalTimeZone] = useState("America/New_York (UTC-04:00)");
    const [localWaterGoal, setLocalWaterGoal] = useState(waterGoal);
    const [localSleepGoal, setLocalSleepGoal] = useState(sleepGoal);
    const [localScreenTimeGoal, setLocalScreenTimeGoal] = useState(screenTimeGoal);
    const [localExerciseGoal, setLocalExerciseGoal] = useState(exerciseGoal);
    const [localMeditationGoal, setLocalMeditationGoal] = useState(meditationGoal);

    const handleSaveSettings = useCallback(() => {
      setUserName(localUserName);
      setWaterGoal(localWaterGoal);
      setSleepGoal(localSleepGoal);
      setScreenTimeGoal(localScreenTimeGoal);
      setExerciseGoal(localExerciseGoal);
      setMeditationGoal(localMeditationGoal);
      alert("Settings saved successfully!");
    }, [
      localUserName,
      localWaterGoal,
      localSleepGoal,
      localScreenTimeGoal,
      localExerciseGoal,
      localMeditationGoal
    ]);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Customize your goals and preferences
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Daily Goals</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Daily Water Target (glasses)
                    </label>
                    <input
                      type="number"
                      value={localWaterGoal}
                      onChange={(e) => setLocalWaterGoal(Number.parseInt(e.target.value))}
                      min="1"
                      max="20"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Daily Sleep Target (hours)
                    </label>
                    <input
                      type="number"
                      value={localSleepGoal}
                      onChange={(e) => setLocalSleepGoal(Number.parseInt(e.target.value))}
                      min="1"
                      max="12"
                      step="0.5"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Screen Time Limit (hours)
                    </label>
                    <input
                      type="number"
                      value={localScreenTimeGoal}
                      onChange={(e) => setLocalScreenTimeGoal(Number.parseInt(e.target.value))}
                      min="0"
                      max="12"
                      step="0.5"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exercise Target (minutes)
                    </label>
                    <input
                      type="number"
                      value={localExerciseGoal}
                      onChange={(e) => setLocalExerciseGoal(Number.parseInt(e.target.value))}
                      min="0"
                      max="180"
                      step="5"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Meditation Target (minutes)
                    </label>
                    <input
                      type="number"
                      value={localMeditationGoal}
                      onChange={(e) => setLocalMeditationGoal(Number.parseInt(e.target.value))}
                      min="0"
                      max="60"
                      step="5"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Account Information</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={localUserName}
                    onChange={(e) => setLocalUserName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time Zone
                  </label>
                  <select
                    value={localTimeZone}
                    onChange={(e) => setLocalTimeZone(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option>America/New_York (UTC-04:00)</option>
                    <option>America/Chicago (UTC-05:00)</option>
                    <option>America/Denver (UTC-06:00)</option>
                    <option>America/Los_Angeles (UTC-07:00)</option>
                    <option>Europe/London (UTC+01:00)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button
                onClick={handleSaveSettings}
                className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Save Changes
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  });


  const Footer = () => {
    const navigateTo = useCallback((view: string) => {
      setActiveView(view);
    }, []);

    return (
      <footer className="mt-12 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-6">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                  HabitNexus
                </h3>
              </div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Build better habits and track your progress with ease.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">Features</h3>
              <ul className="space-y-2">
                <li>
                  <button 
                    onClick={() => navigateTo('home')}
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Dashboard
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigateTo('check-in')}
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Daily Check-ins
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigateTo('streak')}
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Streak Tracking
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => navigateTo('analytics')}
                    className="text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    Analytics
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-600 dark:text-gray-400">
              &copy; {new Date().getFullYear()} Aashish Jha. All rights reserved.
            </p>
            <div className="flex space-x-4 mt-4 md:mt-0">
              <a 
                href="https://github.com/Aashish-Jha-11" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <span className="sr-only">GitHub</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a 
                href="https://aashishjha.vercel.app/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
              >
                <span className="sr-only">Portfolio</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {activeView === 'home' && <HomeView />}
          {activeView === 'check-in' && <CheckInView />}
          {activeView === 'streak' && <StreakView />}
          {activeView === 'analytics' && <AnalyticsView />}
          {activeView === 'settings' && <SettingsView />}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default HabitTracker;