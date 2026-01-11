import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchUsers, addStamp, getUserById, useFreeBurger, buyBurgerWithFreeAvailable, getStampHistory, type StampUser, type StampHistory } from '../lib/supabase';
import { isEmployeeAuthenticated, employeeLogout } from '../lib/auth';

const EmployeeStampPanel = () => {
  const navigate = useNavigate();
  
  // Check authentication on mount
  useEffect(() => {
    if (!isEmployeeAuthenticated()) {
      navigate('/employee/login');
    }
  }, [navigate]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StampUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<StampUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingStamp, setIsAddingStamp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFreeBurgerOptions, setShowFreeBurgerOptions] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load persisted selected user and recent users on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('burgergo_employee_selected_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setSelectedUser(user);
      } catch (e) {
        localStorage.removeItem('burgergo_employee_selected_user');
      }
    }

    const savedRecent = localStorage.getItem('burgergo_recent_users');
    if (savedRecent) {
      try {
        const recent = JSON.parse(savedRecent);
        setRecentUsers(recent.slice(0, 5)); // Keep only last 5
      } catch (e) {
        localStorage.removeItem('burgergo_recent_users');
      }
    }

    // Auto-focus search input
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  }, []);

  // Debounced search users when query changes
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchQuery.trim().length >= 2) {
      // Debounce search by 300ms
      debounceTimerRef.current = setTimeout(() => {
        setIsSearching(true);
        searchUsers(searchQuery.trim())
          .then(users => {
            setSearchResults(users);
          })
          .catch(err => {
            console.error('Search error:', err);
            setSearchResults([]);
          })
          .finally(() => setIsSearching(false));
      }, 300);
    } else if (searchQuery.trim().length === 0) {
      // Only clear results when search is empty, don't clear selected user
      setSearchResults([]);
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const handleAddStamp = async () => {
    if (!selectedUser) return;

    setIsAddingStamp(true);
    setStampAnimation(true);
    
    try {
      const updatedUser = await addStamp(selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
        localStorage.setItem('burgergo_employee_selected_user', JSON.stringify(updatedUser));
        setShowConfirm(false);
        
        // Visual feedback animation
        setTimeout(() => setStampAnimation(false), 600);
        
        // Refresh activity log
        try {
          const history = await getStampHistory(updatedUser.id);
          setActivityLog(history);
        } catch (err) {
          console.warn('Could not refresh activity log:', err);
        }
        
        // Show free burger options if user now has 10+ stamps and didn't before
        if (updatedUser.stamps >= 10 && updatedUser.free_burger_available && selectedUser.stamps < 10) {
          setShowFreeBurgerOptions(true);
          setSuccessMessage(`🎉 스탬프 추가됨! ${updatedUser.name}님은 현재 ${updatedUser.stamps}개의 스탬프를 보유하고 있습니다 - 무료 버거 사용 가능!`);
        } else {
          setSuccessMessage(`✓ 스탬프 추가됨! ${updatedUser.name}님은 현재 ${updatedUser.stamps}개의 스탬프를 보유하고 있습니다.`);
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } else {
        throw new Error('No user data returned from server');
      }
    } catch (error: any) {
      console.error('Error adding stamp:', error);
      setStampAnimation(false);
      const errorMessage = error?.message || error?.toString() || 'Unknown error occurred';
      
      // Better error messages
      let userFriendlyError = '스탬프 추가 실패. ';
      if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyError += '인터넷 연결을 확인하고 다시 시도하세요.';
      } else if (errorMessage.includes('permission') || errorMessage.includes('RLS')) {
        userFriendlyError += '권한이 거부되었습니다. 데이터베이스 정책을 확인하세요.';
      } else if (errorMessage.includes('not found')) {
        userFriendlyError += '사용자를 찾을 수 없습니다. 새로고침하고 다시 시도하세요.';
      } else {
        userFriendlyError += errorMessage;
      }
      
      alert(`${userFriendlyError}\n\n문제가 계속되면 다음을 확인하세요:\n1. Supabase 연결\n2. 브라우저 콘솔의 세부 정보\n3. Supabase의 RLS 정책`);
    } finally {
      setIsAddingStamp(false);
    }
  };

  const handleUseFreeBurger = async () => {
    if (!selectedUser) return;

    setIsAddingStamp(true);
    try {
      const updatedUser = await useFreeBurger(selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
        setShowFreeBurgerOptions(false);
        const stampsUsed = selectedUser.stamps - updatedUser.stamps;
        setSuccessMessage(`무료 버거 사용됨! ${selectedUser.name}님이 스탬프 ${stampsUsed}개를 사용했습니다. 남은 스탬프: ${updatedUser.stamps}개.`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error: any) {
      alert('무료 버거 사용 오류: ' + (error.message || '다시 시도하세요'));
    } finally {
      setIsAddingStamp(false);
    }
  };

  const handleBuyWithFreeAvailable = async () => {
    if (!selectedUser) return;

    setIsAddingStamp(true);
    try {
      const updatedUser = await buyBurgerWithFreeAvailable(selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
        setShowFreeBurgerOptions(false);
        setSuccessMessage(`구매 기록됨! ${updatedUser.name}님은 여전히 무료 버거를 사용할 수 있습니다.`);
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error: any) {
      alert('구매 기록 오류: ' + (error.message || '다시 시도하세요'));
    } finally {
      setIsAddingStamp(false);
    }
  };

  const handleUserSelect = async (user: StampUser) => {
    try {
      // Refresh user data from database
      const freshUser = await getUserById(user.id);
      const userToSet = freshUser || user;
      
      setSelectedUser(userToSet);
      
      // Persist selected user
      localStorage.setItem('burgergo_employee_selected_user', JSON.stringify(userToSet));
      
      // Add to recent users
      const updatedRecent = [userToSet, ...recentUsers.filter(u => u.id !== userToSet.id)].slice(0, 5);
      setRecentUsers(updatedRecent);
      localStorage.setItem('burgergo_recent_users', JSON.stringify(updatedRecent));
      
      // Load activity log
      try {
        const history = await getStampHistory(userToSet.id);
        setActivityLog(history);
      } catch (err) {
        console.warn('Could not load activity log:', err);
        setActivityLog([]);
      }
      
      // Clear search after a short delay to allow selection to show
      setTimeout(() => {
        setSearchQuery('');
        setSearchResults([]);
      }, 100);
    } catch (error) {
      console.error('Error selecting user:', error);
      // Still set the user even if refresh fails
      setSelectedUser(user);
      localStorage.setItem('burgergo_employee_selected_user', JSON.stringify(user));
      setTimeout(() => {
        setSearchQuery('');
        setSearchResults([]);
      }, 100);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 p-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-black text-burger-accent-red mb-2">직원 스탬프 패널</h2>
          <p className="text-gray-500">이름 또는 전화번호 뒷자리 4자리로 검색</p>
        </div>
        <button
          onClick={() => {
            employeeLogout();
            navigate('/employee/login');
          }}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
        >
          로그아웃
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="이름 또는 뒷자리 4자리 입력 (예: 5678)"
          className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-burger-accent-red focus:outline-none transition-all"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Search Results */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">검색 결과</h3>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {isSearching && (
              <p className="text-center text-gray-400 py-8">검색 중...</p>
            )}

            {!isSearching && searchQuery.trim().length < 2 && (
              <p className="text-center text-gray-400 py-8">최소 2자 이상 입력하세요</p>
            )}

            {!isSearching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
              <p className="text-center text-gray-400 py-8">사용자를 찾을 수 없습니다</p>
            )}

            {searchResults.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                  selectedUser?.id === user.id
                    ? 'border-burger-accent-red bg-burger-accent-red/5'
                    : 'border-gray-200 hover:border-burger-accent-red/50 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">전화: ••••{user.phone_last4}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-burger-accent-red">{user.stamps}</p>
                    <p className="text-xs text-gray-400">/10 스탬프</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Selected User & Actions */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4">선택된 사용자</h3>
          
          {selectedUser ? (
            <div className="bg-gray-50 rounded-2xl p-6 border-2 border-gray-200">
              <div className="mb-6">
                <h4 className="text-2xl font-bold text-gray-800 mb-1">{selectedUser.name}</h4>
                <p className="text-sm text-gray-500">전화: ••••{selectedUser.phone_last4}</p>
              </div>

              {/* Stamp Count */}
              <div className="mb-6">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-gray-600 font-medium">현재 스탬프</span>
                  <div className="text-right">
                    <span className="text-4xl font-black text-burger-accent-red">{selectedUser.stamps}</span>
                    <span className="text-gray-400 font-bold ml-1">스탬프</span>
                    {selectedUser.stamps >= 10 && (
                      <div className="text-xs text-green-600 font-semibold mt-1">
                        (무료 버거 {Math.floor(selectedUser.stamps / 10)}개 사용 가능)
                      </div>
                    )}
                  </div>
                </div>

                {/* Stamp Grid - Shows progress toward next free burger */}
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const stampNumber = i + 1;
                    // Show progress toward next free burger (modulo 10)
                    const progressStamps = selectedUser.stamps % 10;
                    const isFilled = stampNumber <= progressStamps;
                    const hasFullSet = selectedUser.stamps >= 10;
                    const isAnimating = stampAnimation && stampNumber === progressStamps && isFilled;
                    return (
                      <div
                        key={stampNumber}
                        className={`aspect-square rounded-full border-2 flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${
                          isFilled
                            ? 'border-burger-accent-red bg-burger-accent-red text-white'
                            : 'border-gray-300 text-gray-400'
                        } ${isAnimating ? 'animate-pulse scale-125 ring-2 ring-burger-accent-red' : ''}`}
                      >
                        {stampNumber === 10 && hasFullSet ? '무료' : !isFilled ? stampNumber.toString().padStart(2, '0') : (
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    );
                  })}
                </div>
                {selectedUser.stamps >= 10 && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    다음 무료 버거까지: {selectedUser.stamps % 10}/10
                  </p>
                )}
              </div>

              {/* Add Stamp Button */}
              <button
                onClick={() => setShowConfirm(true)}
                className="w-full py-4 bg-burger-accent-red text-white font-bold rounded-xl hover:bg-burger-accent-dark transition-all shadow-lg"
              >
                스탬프 추가 (+1)
              </button>
              
              {selectedUser.stamps >= 10 && (
                <button
                  onClick={() => setShowFreeBurgerOptions(true)}
                  className="w-full mt-3 py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-all shadow-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                >
                  무료 버거 사용 (스탬프 10개 사용)
                </button>
              )}

              {/* Activity Log Toggle */}
              {selectedUser && activityLog.length > 0 && (
                <button
                  onClick={() => setShowActivityLog(!showActivityLog)}
                  className="w-full mt-3 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                >
                  {showActivityLog ? '▼ Hide' : '▶ Show'} Activity Log ({activityLog.length})
                </button>
              )}

              {/* Activity Log Display */}
              {showActivityLog && activityLog.length > 0 && (
                <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200 max-h-48 overflow-y-auto">
                  <h4 className="text-sm font-bold text-gray-800 mb-2">최근 활동</h4>
                  <div className="space-y-2">
                    {activityLog.map((entry) => (
                      <div key={entry.id} className="text-xs text-gray-600 flex justify-between items-center py-1 border-b border-gray-100 last:border-0">
                        <span>
                          {entry.added_by === 'employee' ? '📝 스탬프 추가됨' : 
                           entry.added_by === 'free_burger_used' ? '🎁 무료 버거 사용됨' :
                           entry.added_by === 'purchase_with_free_available' ? '💰 구매 기록됨' :
                           '📌 활동'}
                        </span>
                        <span className="text-gray-400">
                          {new Date(entry.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-12 border-2 border-dashed border-gray-200 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <p className="text-gray-400">Select a user to add stamps</p>
            </div>
          )}
        </div>
      </div>

      {/* Free Burger Options Modal */}
      {showFreeBurgerOptions && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">🎉 무료 버거 사용 가능!</h3>
            <p className="text-gray-600 mb-6">
              <strong>{selectedUser.name}</strong>님은 스탬프 10개를 보유하고 있어 무료 버거를 받을 수 있습니다.
              <br /><br />
              어떻게 진행하시겠습니까?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleUseFreeBurger}
                disabled={isAddingStamp}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAddingStamp ? '처리 중...' : '✓ 무료 버거 사용 (스탬프 10개 차감)'}
              </button>
              <button
                onClick={handleBuyWithFreeAvailable}
                disabled={isAddingStamp}
                className="w-full py-4 bg-burger-accent-red text-white font-bold rounded-xl hover:bg-burger-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAddingStamp ? '처리 중...' : '💰 고객 구매 (무료 버거 유지)'}
              </button>
              <button
                onClick={() => setShowFreeBurgerOptions(false)}
                disabled={isAddingStamp}
                className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Free Burger Options Modal */}
      {showFreeBurgerOptions && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">🎉 무료 버거 사용 가능!</h3>
            <p className="text-gray-600 mb-6">
              <strong>{selectedUser.name}</strong>님은 스탬프 10개를 보유하고 있어 무료 버거를 받을 수 있습니다.
              <br /><br />
              어떻게 진행하시겠습니까?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleUseFreeBurger}
                disabled={isAddingStamp}
                className="w-full py-4 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAddingStamp ? '처리 중...' : '✓ 무료 버거 사용 (스탬프 10개 차감)'}
              </button>
              <button
                onClick={handleBuyWithFreeAvailable}
                disabled={isAddingStamp}
                className="w-full py-4 bg-burger-accent-red text-white font-bold rounded-xl hover:bg-burger-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAddingStamp ? '처리 중...' : '💰 고객 구매 (무료 버거 유지)'}
              </button>
              <button
                onClick={() => setShowFreeBurgerOptions(false)}
                disabled={isAddingStamp}
                className="w-full py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">스탬프를 추가하시겠습니까?</h3>
            <p className="text-gray-600 mb-6">
              <strong>{selectedUser.name}</strong>님에게 스탬프 1개를 추가하시겠습니까?
              <br />
              현재: {selectedUser.stamps}개 → 추가 후: {selectedUser.stamps + 1}개
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-all"
              >
                취소
              </button>
              <button
                onClick={handleAddStamp}
                disabled={isAddingStamp}
                className="flex-1 px-4 py-3 bg-burger-accent-red text-white rounded-lg font-semibold hover:bg-burger-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isAddingStamp ? '추가 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeStampPanel;
