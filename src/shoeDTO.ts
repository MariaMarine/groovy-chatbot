import { Festivals } from './festivals';
import { ShoeTypes } from './shoeTypes';

export class ShoeDTO {

    public id: number;

    public locations: Festivals[];
    public name: string;
    public type: ShoeTypes;
    public colour: string;
    public price: number;
    public imgurl: string;
}
