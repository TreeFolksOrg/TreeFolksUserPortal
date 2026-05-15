const cloudinary = require('cloudinary').v2;

const {
    CLOUDINARY_URL,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
} = process.env;

// Configure Cloudinary using either the full URL or individual pieces
if (CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: CLOUDINARY_URL });
} else if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
    });
}

const isConfigured = () => {
    return Boolean(cloudinary.config().cloud_name && cloudinary.config().api_key);
};

const uploadBuffer = (buffer, { folder, filename, ...options } = {}) => {
    if (!isConfigured()) {
        throw new Error('Cloudinary is not configured. Please set CLOUDINARY_URL or cloud name/key/secret.');
    }

    const config = cloudinary.config();
    console.log('[Cloudinary] Upload configuration:', {
        folder,
        filename,
        resource_type: options.resource_type || 'auto',
        bufferSize: buffer.length,
        cloudName: config.cloud_name,
        apiKeyExists: !!config.api_key,
        apiSecretExists: !!config.api_secret,
        apiKeyPrefix: config.api_key ? config.api_key.substring(0, 6) + '...' : 'missing'
    });

    return new Promise((resolve, reject) => {
        // Simplified upload options - remove potentially problematic settings
        const uploadOptions = {
            resource_type: options.resource_type || 'auto',
            folder: folder || undefined,
            // Remove problematic options that might cause 403
            // public_id, use_filename, unique_filename, overwrite can cause issues
        };

        console.log('[Cloudinary] Upload options:', uploadOptions);

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error('[Cloudinary] Upload failed:', {
                        message: error.message,
                        http_code: error.http_code,
                        name: error.name,
                        error: JSON.stringify(error, null, 2)
                    });
                    return reject(error);
                }
                console.log('[Cloudinary] Upload successful:', {
                    secureUrl: result.secure_url,
                    publicId: result.public_id,
                    bytes: result.bytes
                });
                resolve({
                    secureUrl: result.secure_url,
                    publicId: result.public_id,
                    bytes: result.bytes,
                    format: result.format,
                    version: result.version,
                    type: result.type,
                    createdAt: result.created_at,
                });
            }
        );

        uploadStream.end(buffer);
    });
};

const deleteAsset = async (publicId) => {
    if (!publicId) return;
    if (!isConfigured()) {
        throw new Error('Cloudinary is not configured. Please set CLOUDINARY_URL or cloud name/key/secret.');
    }
    try {
        await cloudinary.uploader.destroy(publicId, { invalidate: true });
    } catch (err) {
        // Log but do not throw to avoid masking upstream errors
        console.error(`Cloudinary: failed to delete asset ${publicId}:`, err.message || err);
    }
};

const getSignedUrl = (publicId, options = {}) => {
    if (!isConfigured()) return null;
    return cloudinary.url(publicId, {
        sign_url: true,
        secure: true,
        ...options,
    });
};

module.exports = {
    uploadBuffer,
    deleteAsset,
    isConfigured,
    getSignedUrl,
};
