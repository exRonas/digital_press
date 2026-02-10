declare module 'react-pageflip' {
    import React from 'react';

    export interface FlipBookProps {
        width: number;
        height: number;
        size?: string;
        minWidth?: number;
        maxWidth?: number;
        minHeight?: number;
        maxHeight?: number;
        drawShadow?: boolean;
        flippingTime?: number;
        usePortrait?: boolean;
        startZIndex?: number;
        autoSize?: boolean;
        maxShadowOpacity?: number;
        showCover?: boolean;
        mobileScrollSupport?: boolean;
        clickEventForward?: boolean;
        useMouseEvents?: boolean;
        swipeDistance?: number;
        showPageCorners?: boolean;
        disableFlipByClick?: boolean;
        startPage?: number;
        onFlip?: (e: { data: number }) => void;
        className?: string;
        style?: React.CSSProperties;
        ref?: any;
        children: React.ReactNode;
    }

    export default class HTMLFlipBook extends React.Component<FlipBookProps> {
        pageFlip(): {
            flipNext(): void;
            flipPrev(): void;
        };
    }
}
