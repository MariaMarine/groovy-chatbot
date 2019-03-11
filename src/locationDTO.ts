import { Festivals } from './festivals';
import { PeriodDTO } from './periodDTO';
export class LocationDTO {
    public id: number;
    public city: string;
    public name: Festivals;
    public period: PeriodDTO;
    public modelIds: number [];
    public imgurl: string;

}
