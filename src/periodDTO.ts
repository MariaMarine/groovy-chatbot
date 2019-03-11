export class PeriodDTO {
    public startDate: Date;
    public endDate: Date;
    // tslint:disable-next-line:no-empty
    public constructor(startDate: Date, endDate: Date) {
        this.startDate = startDate,
        this.endDate = endDate;
    }
}
