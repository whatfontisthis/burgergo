import { useState } from 'react';
import { employeeLogin } from '../lib/auth';
import { useNavigate } from 'react-router-dom';

const EmployeeLogin = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate a small delay for better UX
    setTimeout(() => {
      if (employeeLogin(password)) {
        navigate('/employee');
      } else {
        setError('비밀번호가 올바르지 않습니다. 다시 시도하세요.');
        setPassword('');
      }
      setIsLoading(false);
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl md:rounded-2xl shadow-xl p-6 md:p-8 border border-gray-200">
            <div className="text-center mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-black text-burger-accent-red mb-2">버거고</h1>
              <p className="text-gray-600 font-medium text-sm md:text-base">직원 포털</p>
            </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
                  placeholder="직원 비밀번호를 입력하세요"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-burger-accent-red focus:outline-none transition-all text-black min-h-[44px] text-base"
                  autoFocus
                  required
                />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full py-3 bg-burger-accent-red text-white font-bold rounded-xl active:bg-burger-accent-dark md:hover:bg-burger-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg min-h-[50px] touch-manipulation"
              >
                {isLoading ? '로그인 중...' : '로그인'}
              </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400">
            승인된 직원만 사용 가능
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmployeeLogin;
