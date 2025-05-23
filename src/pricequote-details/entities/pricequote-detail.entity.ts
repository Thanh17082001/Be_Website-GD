import { BaseEntity } from "src/common/entities/base.entity";
import { Pricequote } from "src/pricequotes/entities/pricequote.entity";
import { Column, Entity, ManyToOne } from "typeorm";

@Entity()
export class PricequoteDetail extends BaseEntity {
    @ManyToOne(() => Pricequote, (pricequote) => pricequote.details, { onDelete: 'CASCADE' })
    pricequote: Pricequote;

    @Column()
    title: string

    @Column()
    description: string

    @Column()
    content: string

    @Column({ default: '' })
    apply: string

    @Column()
    origin: string

    @Column()
    model: string

    @Column()
    trademark: string

    @Column()
    code: string

    @Column('text', { array: true })
    images: string[];

    @Column()
    quantity: number
    
    @Column()
    grades: string

    @Column()
    classes: string

    @Column()
    subjects: string

    @Column()
    typeProduct: string

    @Column()
    categories: string

    @Column()
    typeParent: string

}
