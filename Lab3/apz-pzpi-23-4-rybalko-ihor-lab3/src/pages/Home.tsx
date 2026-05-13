import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export const Home: React.FC = () => {
  const { t } = useTranslation();

  return (
    <>
      <section className="hero">
        <div className="hero-bg" />
        <div className="container">
          <div className="hero-content">
            <h1>
              {t('welcome_title')}{' '}
              <span className="gradient-text">{t('welcome_title_accent')}</span>
            </h1>
            <p>{t('welcome_desc')}</p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-lg btn-primary">{t('get_started')}</Link>
              <Link to="/restaurants" className="btn btn-lg btn-secondary">{t('browse_restaurants')}</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container">
        <div className="features-grid">
          <div className="feature-card card card-hover">
            <div className="feature-icon" style={{ background: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
              ⚡
            </div>
            <h3>{t('feature_fast_title')}</h3>
            <p>{t('feature_fast_desc')}</p>
          </div>

          <div className="feature-card card card-hover">
            <div className="feature-icon" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
              📊
            </div>
            <h3>{t('feature_manage_title')}</h3>
            <p>{t('feature_manage_desc')}</p>
          </div>

          <div className="feature-card card card-hover">
            <div className="feature-icon" style={{ background: 'var(--info-bg)', color: 'var(--info)' }}>
              🔒
            </div>
            <h3>{t('feature_secure_title')}</h3>
            <p>{t('feature_secure_desc')}</p>
          </div>
        </div>
      </section>
    </>
  );
};
