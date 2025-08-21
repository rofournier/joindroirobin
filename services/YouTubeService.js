class YouTubeService {
    constructor() {
        // Patterns pour détecter les liens YouTube
        this.patterns = [
            // youtube.com/watch?v=...
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
            // youtu.be/...
            /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
            // youtube.com/embed/...
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
            // youtube.com/v/...
            /(?:https?:\/\/)?(?:www\.)?youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
        ];
    }

    /**
     * Détecter si un message contient un lien YouTube
     */
    detectYouTubeLink(message) {
        for (const pattern of this.patterns) {
            const match = message.match(pattern);
            if (match) {
                return {
                    isYouTube: true,
                    videoId: match[1],
                    originalUrl: match[0]
                };
            }
        }
        
        return { isYouTube: false };
    }

    /**
     * Générer l'URL d'embed YouTube
     */
    generateEmbedUrl(videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
    }

    /**
     * Générer l'URL de miniature YouTube
     */
    generateThumbnailUrl(videoId, quality = 'hqdefault') {
        const qualities = {
            'default': 'default.jpg',
            'hqdefault': 'hqdefault.jpg',
            'mqdefault': 'mqdefault.jpg',
            'sddefault': 'sddefault.jpg',
            'maxresdefault': 'maxresdefault.jpg'
        };
        
        const qualityKey = qualities[quality] || qualities.hqdefault;
        return `https://img.youtube.com/vi/${videoId}/${qualityKey}`;
    }

    /**
     * Extraire les informations de la vidéo YouTube
     */
    extractVideoInfo(videoId) {
        return {
            videoId: videoId,
            embedUrl: this.generateEmbedUrl(videoId),
            thumbnailUrl: this.generateThumbnailUrl(videoId),
            watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
            shortUrl: `https://youtu.be/${videoId}`
        };
    }

    /**
     * Traiter un message et remplacer les liens YouTube par des iframes
     */
    processMessage(message) {
        const youtubeInfo = this.detectYouTubeLink(message);
        
        if (!youtubeInfo.isYouTube) {
            return {
                processed: false,
                message: message
            };
        }

        const videoInfo = this.extractVideoInfo(youtubeInfo.videoId);
        
        // Remplacer le lien par un iframe
        const iframeHtml = this.generateIframeHtml(videoInfo);
        
        return {
            processed: true,
            message: message.replace(youtubeInfo.originalUrl, iframeHtml),
            videoInfo: videoInfo
        };
    }

    /**
     * Générer le HTML de l'iframe YouTube
     */
    generateIframeHtml(videoInfo) {
        return `
            <div class="youtube-embed-container">
                <iframe 
                    src="${videoInfo.embedUrl}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    class="youtube-iframe"
                ></iframe>
                <div class="youtube-info">
                    <a href="${videoInfo.watchUrl}" target="_blank" class="youtube-link">
                        <img src="${videoInfo.thumbnailUrl}" alt="Miniature YouTube" class="youtube-thumbnail">
                        <span class="youtube-text">Voir sur YouTube</span>
                    </a>
                </div>
            </div>
        `;
    }

    /**
     * Valider un ID de vidéo YouTube
     */
    isValidVideoId(videoId) {
        return /^[a-zA-Z0-9_-]{11}$/.test(videoId);
    }
}

module.exports = YouTubeService;
