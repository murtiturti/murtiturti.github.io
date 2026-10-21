// Respect reduced motion: reels stay paused until the visitor presses play
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
{
    for (const video of document.querySelectorAll('video[autoplay]'))
    {
        video.removeAttribute('autoplay')
        video.pause()
    }
}
