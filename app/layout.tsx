import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'세종, 오늘의 기온',description:'세종의 공개 기온과 출처, 조회 시각을 정직하게 기록합니다.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
