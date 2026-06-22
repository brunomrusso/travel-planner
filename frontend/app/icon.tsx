import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
          borderRadius: 100,
          flexDirection: 'column',
          gap: 0,
          position: 'relative',
        }}
      >
        {/* Subtle top sheen */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'rgba(255,255,255,0.08)',
            borderRadius: '100px 100px 0 0',
            display: 'flex',
          }}
        />

        {/* Airplane (top-down view, white) */}
        <svg
          viewBox="0 0 512 512"
          width={400}
          height={400}
          style={{ display: 'flex', position: 'absolute', top: 56, left: 56 }}
        >
          {/* Fuselage */}
          <path
            d="M256 72 C272 72 282 88 282 112 L282 340 C282 362 272 374 256 374 C240 374 230 362 230 340 L230 112 C230 88 240 72 256 72 Z"
            fill="white"
          />
          {/* Left wing */}
          <path d="M230 188 L76 274 L76 302 L230 236 Z" fill="white" />
          {/* Right wing */}
          <path d="M282 188 L436 274 L436 302 L282 236 Z" fill="white" />
          {/* Left tail */}
          <path d="M230 308 L152 352 L152 370 L230 338 Z" fill="white" />
          {/* Right tail */}
          <path d="M282 308 L360 352 L360 370 L282 338 Z" fill="white" />
          {/* Cockpit */}
          <ellipse cx="256" cy="104" rx="14" ry="20" fill="rgba(20,184,166,0.65)" />
          {/* Orange pin */}
          <circle cx="256" cy="418" r="22" fill="#ea580c" />
          <path d="M256 440 Q234 460 256 480 Q278 460 256 440 Z" fill="#ea580c" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
