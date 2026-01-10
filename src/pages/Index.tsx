import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  searchUsersByLast4, 
  registerUser, 
  verifyUserByName,
  type StampUser 
} from '../lib/supabase';
import { POPULAR_MENU_ITEMS, STORE_INFO } from '../constants/menu';
import { MOCK_USERS } from '../constants/mockData';
import BurgerCard from '../components/BurgerCard';
import { LocationIcon } from '../components/icons/LocationIcon';
import { CalendarIcon } from '../components/icons/CalendarIcon';
import { MapIcon } from '../components/icons/MapIcon';
import { InstagramIcon } from '../components/icons/InstagramIcon';

const Index = () => {
  const [phoneDigits, setPhoneDigits] = useState('');
  const [selectedUser, setSelectedUser] = useState<StampUser | null>(null);
  const [matchedUsers, setMatchedUsers] = useState<StampUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerName, setRegisterName] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleDigitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPhoneDigits(value);
    if (value.length < 4) {
      setSelectedUser(null);
      setMatchedUsers([]);
    }
  }, []);

  // Search users when 4 digits entered
  useEffect(() => {
    if (phoneDigits.length === 4) {
      setIsSearching(true);
      searchUsersByLast4(phoneDigits)
        .then(users => {
          if (users.length === 0 && import.meta.env.VITE_SUPABASE_URL) {
            // Use mock data only if Supabase not configured
            setMatchedUsers([]);
          } else if (users.length === 0) {
            // Fallback to mock data
            setMatchedUsers(MOCK_USERS.filter(u => u.phone_last4 === phoneDigits));
          } else {
            setMatchedUsers(users);
            // Auto-select if only one match
            if (users.length === 1) {
              setSelectedUser(users[0]);
            } else {
              setSelectedUser(null);
            }
          }
        })
        .catch(err => {
          console.error('Search error:', err);
          // Fallback to mock data
          setMatchedUsers(MOCK_USERS.filter(u => u.phone_last4 === phoneDigits));
        })
        .finally(() => setIsSearching(false));
    } else {
      setMatchedUsers([]);
      setSelectedUser(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneDigits]);

  const handleUserSelect = (user: StampUser) => {
    setSelectedUser(user);
  };

  const handleRegister = async () => {
    if (!registerName.trim() || !registerPhone.trim()) {
      setRegisterError('Please fill in all fields');
      return;
    }

    setIsRegistering(true);
    setRegisterError('');

    try {
      const newUser = await registerUser(registerName.trim(), registerPhone.trim());
      if (newUser) {
        setSelectedUser(newUser);
        setShowRegisterModal(false);
        setRegisterName('');
        setRegisterPhone('');
        setPhoneDigits(newUser.phone_last4);
      }
    } catch (error: any) {
      if (error.message === 'Phone number already registered') {
        // Check if name matches existing user
        const phoneLast4 = registerPhone.replace(/\D/g, '').slice(-4);
        const existingUser = await verifyUserByName(registerName.trim(), phoneLast4);
        if (existingUser) {
          setSelectedUser(existingUser);
          setShowRegisterModal(false);
          setRegisterName('');
          setRegisterPhone('');
          setPhoneDigits(existingUser.phone_last4);
        } else {
          setRegisterError('This phone number is already registered. Please enter the correct name.');
        }
      } else {
        setRegisterError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const currentStamps = useMemo(() => selectedUser ? selectedUser.stamps : 0, [selectedUser]);
  return (
    <div className="bg-burger-primary text-burger-primary-text min-w-[1000px]">
      <div className="max-w-[1600px] mx-auto px-16 xl:px-24 2xl:px-32">
      {/* Header */}
      <header className="py-[40px] flex justify-between items-center relative z-50 border-b border-black/10">
        <div className="flex items-center">
          <div className="text-burger-accent-red text-xl font-bold uppercase tracking-wider">{STORE_INFO.name}</div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-8 pb-12 flex justify-between items-center gap-12 relative min-h-[60vh]">
        <div className="flex-0">
          <h1 className="text-burger-accent-red font_archivo_black text-5xl xl:text-8xl leading-none mb-6">
            Let's<br />Grab a Bite, BURGERGO!
          </h1>
          <p className="text-burger-primary-text text-lg xl:text-xl font-medium xl:w-[500px] w-[400px] mt-6 mb-6">
            A place to grab delicious handmade burgers
          </p>
          <div className="flex gap-4 mt-8">
            <button className="bg-burger-accent-red text-white px-8 py-3 rounded-full font-semibold border border-burger-accent-red hover:bg-burger-accent-dark hover:scale-105 hover:shadow-lg transition-all duration-300">Order Now</button>
          </div>
        </div>

        <div className="flex justify-center gap-6 max-w-[1060px] w-[97%]">
          <img className="w-1/2 h-auto rounded-2xl border-4 border-burger-accent-red hover:scale-105 hover:brightness-110 transition-all duration-300 cursor-pointer object-cover shadow-xl" src="/images/burgergo-poster.jpg" alt="BURGERGO" />
          <img className="w-1/2 h-auto rounded-2xl border-4 border-burger-accent-red hover:scale-105 hover:brightness-110 transition-all duration-300 cursor-pointer object-cover shadow-xl" src="/images/burgergo-poster2.jpg" alt="BURGERGO" />
        </div>
      </section>

      {/* Info Bar */}
      <section className="mb-16">
        <div className="flex justify-center items-center">
          <div className="bg-burger-accent-red rounded-[3rem] py-[12px] px-[20px] shadow-xl flex items-center gap-1">
            <div className="flex-1 flex items-start px-3 py-2 gap-3 xl:px-4 xl:py-3 w-full min-w-[200px] xl:min-w-[280px] wrap-nowrap cursor-pointer hover:bg-burger-accent-dark rounded-2xl transition-all duration-300">
              <div className="w-10 h-10 xl:w-12 xl:h-12 flex items-center justify-center text-white flex-shrink-0">
                <LocationIcon className="w-6 h-6 xl:w-7 xl:h-7" />
              </div>
                <div className="flex-1">
                  <div className="text-white/80 text-xs xl:text-sm mb-1">Location</div>
                  <div className="text-white font-medium text-xs xl:text-sm mb-1">{STORE_INFO.address}</div>
                  <div className="text-white/90 font-medium text-xs mt-1.5 leading-relaxed whitespace-pre-line">{STORE_INFO.locationDetails}</div>
                </div>
            </div>

            <div className="flex-1 flex items-start px-3 py-2 gap-3 xl:px-4 xl:py-3 w-full min-w-[400px] xl:min-w-[500px] cursor-pointer hover:bg-burger-accent-dark rounded-2xl transition-all duration-300">
              <div className="w-10 h-10 xl:w-12 xl:h-12 flex items-center justify-center text-white flex-shrink-0">
                <CalendarIcon className="w-6 h-6 xl:w-7 xl:h-7" />
              </div>
              <div className="flex-1">
                <div className="text-white/80 text-xs xl:text-sm mb-1">Hours</div>
                <div className="flex flex-col gap-y-1">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <div className="text-white font-medium text-xs xl:text-sm whitespace-nowrap">
                      <span className="font-semibold">Tue-Sat:</span> {STORE_INFO.hours.tueSat} <span className="text-white/90 text-xs">(Last: {STORE_INFO.hours.lastOrder.tueSat})</span>
                    </div>
                    <div className="text-white font-medium text-xs xl:text-sm whitespace-nowrap">
                      <span className="font-semibold">Sun:</span> {STORE_INFO.hours.sun} <span className="text-white/90 text-xs">(Last: {STORE_INFO.hours.lastOrder.sun})</span>
                    </div>
                  </div>
                  <div className="text-white/90 font-medium text-xs xl:text-sm whitespace-nowrap">
                    <span className="font-semibold">Mon:</span> {STORE_INFO.hours.mon}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Burgers Section */}
      <section className="mb-16 bg-white">
        <div className="mb-10">
          <h2 className="text-black text-4xl xl:text-6xl font_archivo_black capitalize leading-tight mb-2">Our Popular Menu</h2>
          <p className="text-black/60 text-sm xl:text-base">Discover our signature burgers made with fresh ingredients</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 xl:gap-8">
          {POPULAR_MENU_ITEMS.map((item) => (
            <BurgerCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* Stamp Signup Section */}
      <section className="mb-16">
        <div className="flex justify-center">
          <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row min-h-[500px]">
            
            {/* Left Side - Stamp Grid */}
            <div className="w-full md:w-3/5 p-8 bg-gray-50 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-gray-100">
              <div className="w-full max-w-md bg-white p-6 rounded-3xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-burger-accent-red italic leading-none">BURGERGO!</h2>
                    <p className="text-gray-400 text-xs font-bold mt-1 uppercase tracking-widest">
                      {selectedUser ? selectedUser.name : "Guest Member"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-black text-gray-800">{currentStamps}</span>
                    <span className="text-gray-400 font-bold">/10</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {Array.from({ length: 10 }, (_, i) => {
                    const stampNumber = i + 1;
                    const isFilled = stampNumber <= currentStamps;
                    return (
                      <div
                        key={stampNumber}
                        className={`aspect-square rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                          isFilled
                            ? 'border-burger-accent-red bg-burger-accent-red text-white'
                            : 'border-gray-200 text-gray-300'
                        } ${stampNumber === 10 && isFilled ? 'animate-bounce' : ''}`}
                        style={isFilled && stampNumber !== 10 ? {
                          backgroundImage: 'url(/images/burgergo-stamp.jpg)',
                          backgroundSize: '70%',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center'
                        } : {}}
                      >
                        {stampNumber === 10 ? 'FREE' : !isFilled ? stampNumber.toString().padStart(2, '0') : ''}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-dashed border-gray-200 flex justify-between items-center">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">10th Burger is FREE!</p>
                  <div className="bg-burger-accent-red/10 text-burger-accent-red text-[10px] font-black px-2 py-1 rounded">VIP REWARD</div>
                </div>
              </div>
            </div>

            {/* Right Side - Input */}
            <div className="w-full md:w-2/5 p-8 flex flex-col justify-center">
              <div className="text-center md:text-left mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Welcome Back!</h1>
                <p className="text-gray-500">Enter your last 4 digits</p>
              </div>

              <div className="relative mb-6">
                <input 
                  type="tel" 
                  maxLength={4}
                  value={phoneDigits}
                  onChange={handleDigitChange}
                  placeholder="0000"
                  className="w-full text-center text-5xl font-bold tracking-[0.2em] py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-burger-accent-red focus:bg-white focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-3 min-h-[150px]">
                {phoneDigits.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-300">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                    </svg>
                    <p className="text-sm">Find your account</p>
                  </div>
                )}

                {phoneDigits.length > 0 && phoneDigits.length < 4 && (
                  <p className="text-center text-burger-accent-red animate-pulse text-sm">Searching...</p>
                )}

                {isSearching && phoneDigits.length === 4 && (
                  <p className="text-center text-burger-accent-red animate-pulse text-sm">Searching...</p>
                )}

                {!isSearching && phoneDigits.length === 4 && matchedUsers.length > 0 && (
                  <>
                    {matchedUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="w-full p-4 bg-white border border-gray-200 hover:border-burger-accent-red hover:shadow-md rounded-2xl flex justify-between items-center transition-all group"
                      >
                        <div className="text-left">
                          <p className="font-bold text-gray-800">{user.name}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-tighter">Click to select</p>
                        </div>
                        <span className="text-burger-accent-red font-black group-hover:translate-x-1 transition-transform">→</span>
                      </button>
                    ))}
                  </>
                )}

                {!isSearching && phoneDigits.length === 4 && matchedUsers.length === 0 && (
                  <button
                    onClick={() => setShowRegisterModal(true)}
                    className="w-full p-4 bg-burger-accent-red text-white font-bold rounded-2xl shadow-lg shadow-burger-accent-red/30 hover:scale-[1.02] transition-all"
                  >
                    Create Account with "{phoneDigits}" ✨
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Registration Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h3>
              <p className="text-gray-500 text-sm mb-6">Register with your name and phone number</p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="reg-name" className="block text-sm font-medium text-black mb-2">Name</label>
                  <input
                    type="text"
                    id="reg-name"
                    value={registerName}
                    onChange={(e) => {
                      setRegisterName(e.target.value);
                      setRegisterError('');
                    }}
                    placeholder="Enter your name"
                    className="w-full px-4 py-3 border border-black/20 rounded-lg outline-none focus:border-burger-accent-red focus:ring-2 focus:ring-burger-accent-red/10 text-black transition-all duration-300"
                  />
                </div>
                
                <div>
                  <label htmlFor="reg-phone" className="block text-sm font-medium text-black mb-2">Phone Number</label>
                  <input
                    type="tel"
                    id="reg-phone"
                    value={registerPhone}
                    onChange={(e) => {
                      setRegisterPhone(e.target.value);
                      setRegisterError('');
                    }}
                    placeholder="010-1234-5678"
                    className="w-full px-4 py-3 border border-black/20 rounded-lg outline-none focus:border-burger-accent-red focus:ring-2 focus:ring-burger-accent-red/10 text-black transition-all duration-300"
                  />
                  <p className="text-xs text-gray-400 mt-1">Last 4 digits: {registerPhone.replace(/\D/g, '').slice(-4) || '____'}</p>
                </div>

                {registerError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{registerError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowRegisterModal(false);
                      setRegisterName('');
                      setRegisterPhone('');
                      setRegisterError('');
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegister}
                    disabled={isRegistering}
                    className="flex-1 px-4 py-3 bg-burger-accent-red text-white rounded-lg font-semibold hover:bg-burger-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isRegistering ? 'Registering...' : 'Register'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="pb-8 bg-black/5 pt-6">

        {/* Footer Content */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 text-black/80">
          {/* Brand & Contact */}
          <div className="flex flex-col items-center">
            <h3 className="text-xl font-bold mb-4 text-burger-accent-red">{STORE_INFO.name}</h3>
            <p className="text-sm mb-2 text-black/70">{STORE_INFO.fullAddress}</p>
            <p className="text-sm mb-4 font-medium text-black">{STORE_INFO.phone}</p>
            <div className="flex gap-4">
              <a 
                href={STORE_INFO.social.naverMap} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-black/30 flex items-center justify-center hover:bg-black hover:text-white hover:scale-110 transition-all duration-300 cursor-pointer"
                aria-label="네이버 지도"
              >
                <MapIcon />
              </a>
              <a 
                href={STORE_INFO.social.instagram} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-black/30 flex items-center justify-center hover:bg-black hover:text-white hover:scale-110 transition-all duration-300 cursor-pointer"
                aria-label="인스타그램"
              >
                <InstagramIcon />
              </a>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
};

export default Index;