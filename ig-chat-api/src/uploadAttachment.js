"use strict";

/**
 * @author Gtajisan
 * Instagram Chat API - Upload Attachment
 */

const fs = require("fs-extra");
const path = require("path");
const FormData = require("form-data");

module.exports = function(ctx, api) {
    return function uploadAttachment(attachments, callback) {
        let resolveFunc = () => {};
        let rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve;
            rejectFunc = reject;
        });
        
        if (!callback) {
            callback = (err, data) => {
                if (err) return rejectFunc(err);
                resolveFunc(data);
            };
        }
        
        if (!Array.isArray(attachments)) {
            attachments = [attachments];
        }
        
        const uploads = [];
        
        for (const attachment of attachments) {
            const form = new FormData();
            
            if (typeof attachment === "string") {
                if (fs.existsSync(attachment)) {
                    form.append("photo", fs.createReadStream(attachment));
                }
            } else if (attachment.readable) {
                form.append("photo", attachment);
            }
            
            const headers = {
                ...api.getHeaders(),
                ...form.getHeaders()
            };
            
            uploads.push(
                ctx.axios.post("/rupload_igphoto/", form, { headers })
                .then(response => {
                    if (response.data && response.data.upload_id) {
                        return { upload_id: response.data.upload_id };
                    }
                    return null;
                })
                .catch(() => null)
            );
        }
        
        Promise.all(uploads)
        .then(results => {
            callback(null, results.filter(r => r !== null));
        })
        .catch(err => {
            callback(new Error(err.message));
        });
        
        return returnPromise;
    };
};
