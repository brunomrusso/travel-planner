interface FlagImgProps {
  code: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = { sm: '16x12', md: '24x18', lg: '32x24', xl: '64x48' };

export default function FlagImg({ code, size = 'md', className = '' }: FlagImgProps) {
  if (!code || code.length !== 2) {
    return <span className={`text-base ${className}`}>🌍</span>;
  }
  const dim = SIZE_MAP[size];
  return (
    <img
      src={`https://flagcdn.com/${dim}/${code.toLowerCase()}.png`}
      srcSet={`https://flagcdn.com/${parseInt(dim) * 2}x${parseInt(dim.split('x')[1]) * 2}/${code.toLowerCase()}.png 2x`}
      alt={code.toUpperCase()}
      title={code.toUpperCase()}
      className={`inline-block rounded-sm align-middle ${className}`}
      style={{ width: parseInt(dim), height: parseInt(dim.split('x')[1]) }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
    />
  );
}
