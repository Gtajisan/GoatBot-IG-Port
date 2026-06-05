"use strict";

const fs = require("fs");
const FormData = require("form-data");
const path = require("path");

module.exports = function(ctx, api) {
    return function changeGroupImage(image, threadID, callback) {
        let resolveFunc = () => {}, rejectFunc = () => {};
        const returnPromise = new Promise((resolve, reject) => {
            resolveFunc = resolve; rejectFunc = reject;
        });
        if (!callback) callback = (err, data) => err ? rejectFunc(err) : resolveFunc(data);

        const form = new FormData();

        if (typeof image === "string" && fs.existsSync(image)) {
            form.append("photo", fs.createReadStream(image), { filename: path.basename(image) });
        } else if (image && typeof image.pipe === "function") {
            form.append("photo", image);
        } else {
            callback(null, { success: false, message: "Invalid image: must be a file path or readable stream" });
            return returnPromise;
        }

        ctx.axios.post(
            `/api/v1/direct_v2/threads/${threadID}/update_group_photo/`,
            form,
            { headers: { ...api.getHeaders(), ...form.getHeaders() } }
        )
        .then(res => callback(null, { success: res.data?.status === "ok", threadID }))
        .catch(err => {
            console.log("[ig-chat-api] changeGroupImage:", err.message);
            callback(null, { success: false, message: err.message });
        });

        return returnPromise;
    };
};
