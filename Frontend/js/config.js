// config.js - Centralized configuration
export const API_BASE = 'http://127.0.0.1:5000';
export const DOM_ELEMENTS = {
  content: document.getElementById('content'),
  pageTitle: document.getElementById('page-title'),
  pageDescription: document.getElementById('page-description'),
  currentDate: document.getElementById('current-date'),
  userIdDisplay: document.getElementById('user-id-display'),
  themeToggle: document.getElementById('toggle-theme')
};
export const CHART_COLORS = {
  primary: '#7b68ee',
  positive: '#4cd964',
  negative: '#ff6b6b',
  accent1: '#ffcc00',
  accent2: '#5ac8fa'
};