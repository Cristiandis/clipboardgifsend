import { findByProps } from "@vendetta/metro";
import { instead } from "@vendetta/patcher";
import { clipboard } from "@vendetta/metro/common";

let unpatch;

try {
    const messageModule = findByProps("sendMessage");
    
    if (!messageModule?.sendMessage) {
        throw new Error("sendMessage not found");
    }
    
    unpatch = instead("sendMessage", messageModule, (args, orig) => {
        const [channelId, message, ...rest] = args;
        
        const content = message?.content?.trim();
        
        const isJustUrl = content && 
                         content.startsWith('http') && 
                         !content.includes(' ') &&
                         !content.includes('\n');
        
        const isGifUrl = isJustUrl && 
                        (content.endsWith('.gif') || 
                         content.includes('cdn.discordapp.com/attachments') ||
                         content.includes('tenor.com') ||
                         content.includes('giphy.com'));
        
        const isFromGifPicker = message?.type === undefined && 
                               message?.tts === false &&
                               isGifUrl;
        
        console.log("Message debug:", {
            content,
            type: message?.type,
            tts: message?.tts,
            keys: Object.keys(message || {})
        });
        
        if (isFromGifPicker) {
            clipboard.setString(content);
            
            const Toasts = findByProps("showToast");
            if (Toasts?.showToast) {
                Toasts.showToast("GIF URL copied to clipboard!", Toasts.ToastType?.SUCCESS);
            }
            
            return;
        }
        
        return orig(...args);
    });
    
} catch (error) {
    console.error("Plugin failed:", error);
}

export const onUnload = () => {
    if (unpatch) unpatch();
};