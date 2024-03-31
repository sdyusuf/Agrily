import React from 'react';
import { Link } from 'react-router-dom';
import { SproutIcon } from './Icons';

/**
 * Standardized Agrily Brand Logo Component
 * Uses standard SVG vector icon instead of emojis
 */
export const Logo = ({
  size = 'md',
  variant = 'default',
  showIcon = true,
  showText = true,
  linkTo = '/',
  className = '',
  style = {}
}) => {
  const sizes = {
    sm: { iconPixels: 18, text: '1.2rem', gap: '0.4rem', containerPadding: '4px' },
    md: { iconPixels: 22, text: '1.45rem', gap: '0.5rem', containerPadding: '5px' },
    lg: { iconPixels: 28, text: '1.85rem', gap: '0.65rem', containerPadding: '7px' },
    xl: { iconPixels: 36, text: '2.25rem', gap: '0.8rem', containerPadding: '9px' }
  };

  const colors = {
    default: { text: '#bc6c25', iconBg: '#ecfdf5', iconColor: '#2d6a4f', border: '#a7f3d0' },
    light: { text: '#dda15e', iconBg: 'rgba(255, 255, 255, 0.12)', iconColor: '#52b788', border: 'rgba(255, 255, 255, 0.2)' },
    white: { text: '#ffffff', iconBg: 'rgba(255, 255, 255, 0.15)', iconColor: '#ffffff', border: 'rgba(255, 255, 255, 0.3)' },
    dark: { text: '#1b4332', iconBg: '#fefae0', iconColor: '#bc6c25', border: '#fde68a' }
  };

  const selectedSize = sizes[size] || sizes.md;
  const theme = colors[variant] || colors.default;

  const content = (
    <div
      className={`agrily-brand-logo ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: selectedSize.gap,
        userSelect: 'none',
        lineHeight: 1,
        ...style
      }}
    >
      {showIcon && (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: theme.iconBg,
            border: `1.5px solid ${theme.border}`,
            borderRadius: '10px',
            padding: selectedSize.containerPadding,
            color: theme.iconColor,
            boxShadow: '0 2px 4px rgba(15, 23, 42, 0.04)',
            transition: 'all 200ms ease'
          }}
        >
          <SproutIcon size={selectedSize.iconPixels} color={theme.iconColor} />
        </span>
      )}
      {showText && (
        <span
          className="brand-font"
          style={{
            fontSize: selectedSize.text,
            fontWeight: '800',
            color: theme.text,
            letterSpacing: '-0.03em',
            lineHeight: 1
          }}
        >
          Agrily
        </span>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} style={{ textDecoration: 'none', display: 'inline-flex' }}>
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
