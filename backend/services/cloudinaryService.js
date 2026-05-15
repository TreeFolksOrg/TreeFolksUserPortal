const cloudinary = require('cloudinary').v2;

const {
    CLOUDINARY_URL,
    CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET,
} = process.env;

// Debug: Log what we received from environment
console.log('[Cloudinary] Environment variables loaded:', {
    hasURL: !!CLOUDINARY_URL,
    hasCloudName: !!CLOUDINARY_CLOUD_NAME,
    hasApiKey: !!CLOUDINARY_API_KEY,
    hasApiSecret: !!CLOUDINARY_API_SECRET,
    urlFormat: CLOUDINARY_URL ? 'cloudinary://...' : 'missing'
});

// Configure Cloudinary using either the full URL or individual pieces
if (CLOUDINARY_URL) {
    cloudinary.config({ cloudinary_url: CLOUDINARY_URL });
    console.log('[Cloudinary] Configured using CLOUDINARY_URL');
} else if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
    });
    console.log('[Cloudinary] Configured using individual credentials');
} else {
    console.error('[Cloudinary] No valid configuration found!');
}

const isConfigured = () => {
    const config = cloudinary.config();
    const hasCredentials = Boolean(config.cloud_name && config.api_key && config.api_secret);
    
    console.log('[Cloudinary] Configuration check:', {
        hasCloudName: !!config.cloud_name,
        hasApiKey: !!config.api_key,
        hasApiSecret: !!config.api_secret,
        cloudName: config.cloud_name,
        apiKeyLength: config.api_key ? config.api_key.length : 0,
        apiSecretLength: config.api_secret ? config.api_secret.length : 0
    });
    
    return hasCredentials;
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
        // Try simplified options first - minimal settings to avoid 403
        const uploadOptions = {
            resource_type: options.resource_type || 'auto',
            // Don't specify folder initially to test if that's causing issues
        };

        console.log('[Cloudinary] Attempting upload with minimal options:', uploadOptions);

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
                    
                    // Provide more helpful error message
                    const enhancedError = new Error(
                        `Cloudinary upload failed: ${error.message}. ` +
                        `This might be due to invalid API credentials, account restrictions, or exceeded quota. ` +
                        `Please verify your Cloudinary account status and API credentials.`
                    );
                    enhancedError.http_code = error.http_code;
                    enhancedError.originalError = error;
                    return reject(enhancedError);
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
