const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class ImageService {
    constructor() {
        this.uploadDir = path.join(__dirname, '../public/uploads');
        this.maxFileSize = 10 * 1024 * 1024; // 10MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        this.ensureUploadDirectory();
    }

    /**
     * S'assurer que le répertoire d'upload existe
     */
    async ensureUploadDirectory() {
        try {
            await fs.access(this.uploadDir);
        } catch (error) {
            await fs.mkdir(this.uploadDir, { recursive: true });
        }
    }

    /**
     * Traiter et sauvegarder une image
     */
    async processAndSaveImage(buffer, originalName, mimeType) {
        try {
            // Vérifier le type de fichier
            if (!this.allowedTypes.includes(mimeType)) {
                throw new Error('Type de fichier non supporté');
            }

            // Vérifier la taille
            if (buffer.length > this.maxFileSize) {
                throw new Error('Fichier trop volumineux');
            }

            // Générer un nom unique
            const fileId = uuidv4();
            const extension = path.extname(originalName) || '.jpg';
            const filename = `${fileId}${extension}`;
            const filepath = path.join(this.uploadDir, filename);

            // Sauvegarder l'image directement (sans traitement Sharp)
            await fs.writeFile(filepath, buffer);

            // Pour l'instant, pas de miniature (on peut l'ajouter plus tard)
            // TODO: Implémenter la création de miniatures sans Sharp

            return {
                success: true,
                filename: filename,
                thumbnail: filename, // Même fichier pour l'instant
                originalName: originalName,
                size: buffer.length,
                width: 0, // Pas de métadonnées pour l'instant
                height: 0,
                url: `/uploads/${filename}`,
                thumbnailUrl: `/uploads/${filename}`
            };

        } catch (error) {
            console.error('Erreur lors du traitement de l\'image:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Supprimer une image
     */
    async deleteImage(filename) {
        try {
            const filepath = path.join(this.uploadDir, filename);
            await fs.unlink(filepath);
            
            // Supprimer aussi la miniature si elle existe
            const thumbnailName = filename.replace(/^/, 'thumb_');
            const thumbnailPath = path.join(this.uploadDir, thumbnailName);
            try {
                await fs.unlink(thumbnailPath);
            } catch (e) {
                // La miniature n'existe peut-être pas
            }
            
            return { success: true };
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Obtenir les informations d'une image
     */
    async getImageInfo(filename) {
        try {
            const filepath = path.join(this.uploadDir, filename);
            const stats = await fs.stat(filepath);
            
            return {
                success: true,
                filename: filename,
                size: stats.size,
                width: 0, // Pas de métadonnées pour l'instant
                height: 0,
                format: path.extname(filename).substring(1),
                url: `/uploads/${filename}`
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = ImageService;
