"use client";
import React from 'react';
import Sidebar from '../../components/common/Sidebar/Sidebar';
import Header from '../../components/common/Header';
import Footer from '../../components/common/Footer';
import ProtectedRoute from '../../components/ProtectedRoute';
import { useTheme, useCompanyTheme } from '../../store/hooks';
import { useDispatch_ } from '../../store';
import { setTheme, setCompanyThemeColor } from '../../store/api_query/global';

const DashboardPage = () => {
  const { isDark, colors, companyThemeColor } = useTheme();
  const { user, company } = useCompanyTheme();
  const dispatch = useDispatch_();
  const toggleTheme = () => {
    dispatch(setTheme(isDark ? 'light' : 'dark'));
  };

  const changeCompanyColor = (color: string) => {
    dispatch(setCompanyThemeColor(color));
  };

  return (
    <ProtectedRoute>
      <div className="w-screen h-screen overflow-hidden flex" style={{
        backgroundColor: isDark ? colors.dark.lightBg : colors.light.background
      }}>
        <Sidebar />
        <div className="flex-1 h-full flex flex-col relative">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold" style={{
                color: isDark ? colors.dark.text : colors.light.text
              }}>
                Dashboard
              </h1>
              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: companyThemeColor }}
                >
                  {isDark ? '☀️ Light' : '🌙 Dark'}
                </button>
              </div>
            </div>

            {/* Company Theme Information */}
            <div className="p-4 rounded-lg" style={{
              backgroundColor: isDark ? colors.dark.lightBg : colors.light.lightBg,
              border: `1px solid ${isDark ? colors.dark.lightText : colors.light.text}20`
            }}>
              <h2 className="text-lg font-semibold mb-4" style={{
                color: isDark ? colors.dark.text : colors.light.text
              }}>
                Company Information
              </h2>
              <div className="space-y-2">
                <div className="text-sm" style={{
                  color: isDark ? colors.dark.lightText : colors.light.text
                }}>
                  <strong>Company:</strong> {company?.name || 'Loading...'}
                </div>
                <div className="text-sm" style={{
                  color: isDark ? colors.dark.lightText : colors.light.text
                }}>
                  <strong>Theme Color:</strong> {company?.themeColor || companyThemeColor}
                  <div
                    className="inline-block w-4 h-4 rounded ml-2 border"
                    style={{
                      backgroundColor: company?.themeColor || companyThemeColor,
                      borderColor: isDark ? colors.dark.lightText : colors.light.text
                    }}
                  />
                </div>
                <div className="text-sm" style={{
                  color: isDark ? colors.dark.lightText : colors.light.text
                }}>
                  <strong>Current Theme:</strong> {isDark ? 'Dark' : 'Light'} mode
                </div>
              </div>
            </div>

            <div className="p-4 rounded-lg" style={{
              backgroundColor: isDark ? colors.dark.sidebar : colors.light.lightBg,
              border: `1px solid ${isDark ? colors.dark.lightText : colors.light.text}20`
            }}>
              <h2 className="text-lg font-semibold mb-4" style={{
                color: isDark ? colors.dark.text : colors.light.text
              }}>
                Theme Settings (Demo)
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{
                    color: isDark ? colors.dark.lightText : colors.light.text
                  }}>
                    Company Theme Color (Override for Demo)
                  </label>
                  <div className="flex gap-2">
                    {['#004aad', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#973730', '#000000CC'].map(color => (
                      <button
                        key={color}
                        onClick={() => changeCompanyColor(color)}
                        className={`w-8 h-8 rounded border-2 ${companyThemeColor === color ? 'border-white' : 'border-gray-300'}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-2" style={{
                    color: isDark ? colors.dark.lightText : colors.light.lightText
                  }}>
                    Note: This temporarily overrides the company theme. In production, theme color comes from backend company settings.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {['Purchases', 'Warehouse', 'Settings'].map(card => (
                <div
                  key={card}
                  className="p-4 rounded-lg shadow border"
                  style={{
                    backgroundColor: isDark ? colors.dark.sidebar : colors.light.background,
                    borderColor: isDark ? colors.dark.lightText + '20' : colors.light.text + '20'
                  }}
                >
                  <h2 className="font-semibold" style={{
                    color: isDark ? colors.dark.text : colors.light.text
                  }}>
                    {card}
                  </h2>
                  <p className="text-sm mt-2" style={{
                    color: isDark ? colors.dark.lightText : colors.light.lightText
                  }}>
                    Quick summary card placeholder.
                  </p>
                </div>
              ))}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default DashboardPage;
