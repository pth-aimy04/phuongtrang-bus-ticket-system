
IF OBJECT_ID('sp_DoanhThuHomNay', 'P') IS NOT NULL
    DROP PROCEDURE sp_DoanhThuHomNay;
GO

IF OBJECT_ID('sp_TongDoanhThu', 'P') IS NOT NULL
    DROP PROCEDURE sp_TongDoanhThu;
GO

IF OBJECT_ID('sp_DoanhThuTheoTuyen', 'P') IS NOT NULL
    DROP PROCEDURE sp_DoanhThuTheoTuyen;
GO


-- doanh thu ngày
CREATE PROCEDURE sp_DoanhThuHomNay
AS
BEGIN
    SELECT 
        SUM(TR.price) AS TongDoanhThu,
        COUNT(P.payment_id) AS SoGiaoDich
    FROM Payments P
    INNER JOIN Tickets T ON P.ticket_id = T.ticket_id
    INNER JOIN Trips TR ON T.trip_id = TR.trip_id
    WHERE P.status = 'SUCCESS'
      AND CONVERT(date, P.transaction_time) = CONVERT(date, GETDATE())
END
GO

-- tổng doanh thu
CREATE PROCEDURE sp_TongDoanhThu
AS
BEGIN
    SELECT 
        SUM(TR.price) AS TongDoanhThu,
        COUNT(P.payment_id) AS SoGiaoDich
    FROM Payments P
    INNER JOIN Tickets T ON P.ticket_id = T.ticket_id
    INNER JOIN Trips TR ON T.trip_id = TR.trip_id
    WHERE P.status = 'SUCCESS'
END
GO


-- doanh thu theo tuyến
CREATE PROCEDURE sp_DoanhThuTheoTuyen
AS
BEGIN
    SELECT 
        R.start_point + ' → ' + R.end_point AS Tuyen,
        SUM(TR.price) AS DoanhThu,
        COUNT(P.payment_id) AS LuotThanhToan
    FROM Payments P
    INNER JOIN Tickets T ON P.ticket_id = T.ticket_id
    INNER JOIN Trips TR ON T.trip_id = TR.trip_id
    INNER JOIN Routes R ON TR.route_id = R.route_id
    WHERE P.status = 'SUCCESS'
    GROUP BY R.start_point, R.end_point
    ORDER BY DoanhThu DESC
END
GO

GO

use mytrip
go
EXEC sp_DoanhThuHomNay
EXEC sp_TongDoanhThu
EXEC sp_DoanhThuTheoTuyen


DROP PROCEDURE IF EXISTS sp_CreateInvoice;
GO

use mytrip
go

CREATE OR ALTER PROCEDURE sp_CreateInvoice
    @ticket_id INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @booking_code VARCHAR(50),
            @invoice_number VARCHAR(20),
            @secret_code VARCHAR(50),
            @total_amount DECIMAL(18,2),
            @status NVARCHAR(50),
            @trip_id INT;

    -- Lấy thông tin vé
    SELECT 
        @booking_code = booking_code,
        @trip_id = trip_id
    FROM dbo.Tickets
    WHERE ticket_id = @ticket_id;

    IF @booking_code IS NULL
    BEGIN
        PRINT 'Không tìm thấy vé.';
        RETURN;
    END

    -- Nếu booking_code đã có hóa đơn thì không tạo thêm
    IF EXISTS (SELECT 1 FROM dbo.Invoices i 
               JOIN dbo.Tickets t ON i.ticket_id = t.ticket_id
               WHERE t.booking_code = @booking_code)
    BEGIN
        PRINT 'Hóa đơn đã tồn tại cho mã đặt vé này.';
        RETURN;
    END

    -- Lấy tổng tiền từ bảng Trips
    SELECT @total_amount = price FROM dbo.Trips WHERE trip_id = @trip_id;

    -- Sinh ngẫu nhiên invoice_number & secret_code
    SET @invoice_number = 'INV-' + RIGHT('00000' + CAST(ABS(CHECKSUM(NEWID())) % 99999 AS VARCHAR(5)), 5);
    SET @secret_code = 'MYTRIP-' + RIGHT('00000' + CAST(ABS(CHECKSUM(NEWID())) % 99999 AS VARCHAR(5)), 5);

    SET @status = N'Hợp lệ (đã ký số)';

    -- Tạo hóa đơn mới
    INSERT INTO dbo.Invoices (ticket_id, invoice_number, secret_code, total_amount, status, created_at)
    VALUES (@ticket_id, @invoice_number, @secret_code, @total_amount, @status, GETDATE());

    PRINT ' Hóa đơn mới đã được tạo thành công.';
END
GO


CREATE OR ALTER TRIGGER trg_AutoCreateInvoice
ON dbo.Tickets
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ticket_id INT;
    SELECT TOP 1 @ticket_id = ticket_id FROM inserted;
    EXEC dbo.sp_CreateInvoice @ticket_id;
END;
GO


EXEC sp_CreateInvoice 40

