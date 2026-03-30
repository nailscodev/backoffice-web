// Mock for swiper/react — avoids ESM parsing errors in Jest
const React = require('react');
const Swiper = ({ children }) => React.createElement('div', { 'data-testid': 'swiper' }, children);
const SwiperSlide = ({ children }) => React.createElement('div', { 'data-testid': 'swiper-slide' }, children);
module.exports = { Swiper, SwiperSlide };
