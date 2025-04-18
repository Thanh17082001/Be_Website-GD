
import { BaseWithCreatedBy } from "src/common/entities/base-user-createdBy";
import { Grade } from "src/grade/entities/grade.entity";
import { Product } from "src/product/entities/product.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";

@Entity()
export class Class extends BaseWithCreatedBy{
    @Column()
    name: string

    @ManyToOne(() => Grade, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'gradeId' })
    grade?: Grade;

    @Column({ nullable: true })
    gradeId?: number;

    @OneToMany(() => Product, product => product.class)
    products: Product[];
}
