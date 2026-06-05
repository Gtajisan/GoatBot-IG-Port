"use strict";

const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

const MIME_MAP = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".gif": "image/gif", ".webp": "image/webp",
    ".mp4": "video/mp4", ".mov": "video/quicktime",
    ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".m4a": "audio/mp4"
};

module.exports = function(ctx, api) {
    return function uploadAttachment(attachments, callback) {
        let resolveFunc = () => {}, rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (!callback) callback = (err, data) => err ? rejectFunc(err) : resolveFunc(data);
        if (!Array.isArray(attachments)) attachments = [attachments];

        const uploads = attachments.map(attachment => {
            const form = new FormData();
            const uploadId = Date.now().toString();

            if (typeof attachment === "string" && fs.existsSync(attachment)) {
                const ext = path.extname(attachment).toLowerCase();
                const mime = MIME_MAP[ext] || "application/octet-stream";
                form.append("photo", fs.createReadStream(attachment), {
                    filename: path.basename(attachment),
                    contentType: mime
                });
                form.append("upload_id", uploadId);
                form.append("is_sidecar", "0");
            } else if (attachment && typeof attachment.pipe === "function") {
                form.append("photo", attachment);
                form.append("upload_id", uploadId);
            } else {
                return Promise.resolve(null);
            }

            return ctx.axios.post(
                `/rupload_igphoto/${uploadId}`,
                form,
                { headers: { ...api.getHeaders(), ...form.getHeaders() } }
            )
            .then(res => res.data?.upload_id ? { upload_id: res.data.upload_id } : null)
            .catch(() => null);
        });

        Promise.all(uploads)
            .then(results => callback(null, results.filter(r => r !== null)))
            .catch(err => callback(new Error(err.message)));

        return returnPromise;
    };
};
