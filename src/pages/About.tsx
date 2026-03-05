import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const About: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleStartClick = () => {
    if (currentUser) {
      navigate('/home');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#22C7FB]/10 to-white">
      {/* 헤더 */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
        <div className="w-full px-[40px] py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/bplus_text.png" alt="BPLUS" className="h-8" />
          </div>
          {currentUser ? (
            <Link
              to="/home"
              className="px-6 py-2 bg-[#22C7FB] text-white rounded-full hover:bg-[#1BB0E0] transition-colors font-medium"
            >
              홈으로 가기
            </Link>
          ) : (
            <Link
              to="/login"
              className="px-6 py-2 bg-[#22C7FB] text-white rounded-full hover:bg-[#1BB0E0] transition-colors font-medium"
            >
              로그인
            </Link>
          )}
        </div>
      </header>

      {/* 메인 히어로 섹션 */}
      <section className="pt-32 pb-20 px-6 bg-white relative overflow-hidden">
        {/* 리본 장식 - 좌측 배치 */}
        <img
          src="/about_img/riborn_img.png"
          alt=""
          aria-hidden
          className="absolute left-0 top-1/2 w-[40%] max-w-md opacity-90 pointer-events-none scale-[4] -translate-x-[-80%] -translate-y-1/2 translate-y-8"
        />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                시험 2주 전,<br />
                전공 PPT만 올리면 끝
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                한 번의 자료 업로드로<br />
                문제풀이 중심의 학습을 경험하세요
              </p>
              <button
                onClick={handleStartClick}
                className="px-8 py-4 bg-[#22C7FB] text-white rounded-full hover:bg-[#1BB0E0] transition-colors font-bold text-lg shadow-lg hover:shadow-xl"
              >
                시작하기
              </button>
            </div>
            <div className="overflow-hidden">
              <img
                src="/about_img/monitor_img.png"
                alt="BPLUS 대시보드"
                className="w-full block"
                style={{ clipPath: 'inset(0 0 5% 0)' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 주요 기능 섹션 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">
            <span className="logo-font" style={{ color: '#22C7FB' }}>BPLUS</span>의
          </h2>
          <h2 className="text-4xl font-bold text-center mb-16">주요기능</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 실전과 문서 생성 */}
            <div className="bg-[#22C7FB]/10 rounded-3xl p-8 text-center hover:shadow-lg transition-shadow">
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center">
                  <img src="/about_img/doc_icon.png" alt="문서" className="w-16 h-16" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">실전형 문제 생성</h3>
              <p className="text-gray-600 leading-relaxed">
              자료의 핵심 개념을 분석해<br />
              유형별 문제를 생성해요.
              </p>
            </div>

            {/* 핵심 단어만 구성 */}
            <div className="bg-[#22C7FB]/10 rounded-3xl p-8 text-center hover:shadow-lg transition-shadow">
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center">
                  <img src="/about_img/lang_icon.png" alt="단어장" className="w-16 h-16" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">핵심 단어만으로 구성</h3>
              <p className="text-gray-600 leading-relaxed">
                주요 개념과 용어를 선별해<br />
              암기 중심의 카드를 만들어요.
              </p>
            </div>

            {/* 복잡 세트 관리 */}
            <div className="bg-[#22C7FB]/10 rounded-3xl p-8 text-center hover:shadow-lg transition-shadow">
              <div className="mb-6 flex justify-center">
                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center">
                  <img src="/about_img/ppt_icon.png" alt="PPT" className="w-16 h-16" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">학습 세트 관리</h3>
              <p className="text-gray-600 leading-relaxed">
                파일 하나로 시험기간<br />
                자료 정리와 출제 고민을 해결해요.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 가격 플랜 섹션 */}
      <section className="py-20 px-6 bg-gradient-to-b from-[#22C7FB]/10 to-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">필요한 만큼, 집중해서</h2>
          <p className="text-center text-gray-600 mb-16">시험 일정에 맞추어 플랜을 선택하세요</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free 플랜 */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-[#22C7FB]/50 transition-all">
              <div className="text-sm font-bold mb-2" style={{ color: '#22C7FB' }}>Free</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">체험 플랜</h3>
              <p className="text-gray-600 mb-6">
                처음이라면 가볍게
              </p>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li className="flex items-center">
                  <span className="mr-2" style={{ color: '#22C7FB' }}>✓</span>
                    월 3회 업로드
                </li>
                <li className="flex items-center">
                  <span className="mr-2" style={{ color: '#22C7FB' }}>✓</span>
                  기본 문제 생성
                </li>
                <li className="flex items-center">
                  <span className="mr-2" style={{ color: '#22C7FB' }}>✓</span>
                  단어 카드 기능
                </li>
              <div className="mb-6">
                <div className="text-4xl font-bold text-gray-900">₩ 0</div>
              </div>
              </ul>
            </div>

            {/* Standard 플랜 */}
            <div className="bg-white rounded-3xl p-8 border-2 border-[#22C7FB] hover:border-[#1BB0E0] transition-all shadow-lg transform scale-105">
              <div className="text-sm font-bold mb-2" style={{ color: '#22C7FB' }}>Standard</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">2주 정도 패스</h3>
              <p className="text-gray-600 mb-6">
                시험기간 대비 단기 집중이용권
              </p>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li className="flex items-center">
                  <span className="mr-2" style={{ color: '#22C7FB' }}>✓</span>
                  무제한 파일 업로드
                </li>
                <li className="flex items-center">
                  <span className="mr-2" style={{ color: '#22C7FB' }}>✓</span>
                  전체 문제 유형 생성
                </li>
                <li className="flex items-center">
                  <span className="mr-2" style={{ color: '#22C7FB' }}>✓</span>
                  학습세트 저장
                </li>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">₩ 7,900</span>
                  <span className="text-sm text-gray-500">/월</span>
                </div>
              </ul>
            </div>

            {/* Pro 플랜 */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200 hover:border-[#22C7FB]/50 transition-all">
              <div className="text-sm font-bold mb-2" style={{ color: '#22C7FB' }}>Pro</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">한 학기 패스</h3>
              <p className="text-gray-600 mb-6">
                중간, 기말 모두 대비하는 한 학기 플랜
              </p>
              <ul className="space-y-3 mb-8 text-gray-600">
                <li className="flex items-center">
                  <span className="mr-2" style={{ color: '#22C7FB' }}>✓</span>
                  무제한 파일 업로드
                </li>
                <li className="flex items-center">
                  <span className="mr-2" style={{ color: '#22C7FB' }}>✓</span>
                  문제 난이도 조절 기능
                </li>
                <li className="flex items-center">
                  <span className="mr-2" style={{ color: '#22C7FB' }}>✓</span>
                  신규 기능 우선 체험
                </li>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900">₩ 29,900</span>
                  <span className="text-sm text-gray-500">/월</span>
                </div>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 모바일 앱 섹션 */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                본격적인 시험 대비를 위해
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                곧 태블릿 전용 앱이 출시됩니다.<br/>
                터치 기반 문제풀이와 필기 연동으로 더 직관적인 학습을 경험해 보세요.
              </p>
              <div className="flex items-center space-x-4">
                <button className="flex items-center space-x-2 text-gray-900 hover:opacity-80 transition-opacity">
                  <img src="/about_img/apple_icon.png" alt="App Store" className="h-6 w-6" />
                  <span>App Store</span>
                </button>
                <button className="flex items-center space-x-2 text-gray-900 hover:opacity-80 transition-opacity">
                  <img src="/about_img/playstore_icon.png" alt="Google Play" className="h-6 w-6" />
                  <span>Google Play</span>
                </button>
              </div>
            </div>
            <div className="relative">
              <img
                src="/about_img/pad_img.png"
                alt="모바일 앱"
                className="w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/bplus_text.png" alt="BPLUS" className="h-8" />
              </div>
              <p className="text-sm">학습의 새로운 기준</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">서비스</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/home" className="hover:text-white">문제 생성</Link></li>
                <li><Link to="/home" className="hover:text-white">단어장</Link></li>
                <li><Link to="/home" className="hover:text-white">폴더 관리</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">정보</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white">이용약관</a></li>
                <li><a href="#" className="hover:text-white">개인정보처리방침</a></li>
                <li><a href="#" className="hover:text-white">고객지원</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            © 2024 BPLUS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
