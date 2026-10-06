// shared helpers for picture uploads (profile pictures, workspace pictures)

// shrink the picked image so it stays small, cropping the middle to the given shape
// defaults to a 128x128 square (profile pictures)
export const resizeImage = (file, width = 128, height = 128) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const img = new Image();

            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;

                // crop the biggest middle area that has the same shape as the output
                const scale = Math.min(img.width / width, img.height / height);
                const cropWidth = width * scale;
                const cropHeight = height * scale;
                const sx = (img.width - cropWidth) / 2;
                const sy = (img.height - cropHeight) / 2;

                canvas.getContext("2d").drawImage(img, sx, sy, cropWidth, cropHeight, 0, 0, width, height);

                resolve(canvas.toDataURL("image/jpeg", 0.85));
            };

            img.onerror = reject;
            img.src = reader.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
