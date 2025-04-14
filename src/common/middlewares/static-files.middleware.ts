import { Request, Response, NextFunction } from 'express';

export class StaticFilesMiddleware {
    private static allowedDomains = ['http://thienthanh.com', 'http://127.0.0.1:5500/', 'http://192.168.1.128:5501/'];

    use(req: Request, res: Response, next: NextFunction) {
        const origin = req.headers.origin || req.headers.referer || ''; // Lấy Origin hoặc Referer

        // Chỉ cho phép truy cập từ FE của bạn

        // Nếu request có Origin hoặc Referer hợp lệ (FE của bạn)
        if (origin && StaticFilesMiddleware.allowedDomains.some((allowed) => origin.startsWith(allowed))) {
            console.log('dc ');
            return next();
        }
        console.log('k đc', origin);

        return res.status(403).json({ message: 'Access Forbidden' });
    }
}
