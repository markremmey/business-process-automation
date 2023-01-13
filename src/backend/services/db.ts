import { CosmosClient } from "@azure/cosmos"
import { MongoClient } from 'mongodb'
import { BpaPipelines, BpaServiceObject } from "../engine/types"

export abstract class DB {

    protected _connectionString : string
    protected _dbName : string
    protected _containerName : string
    protected _pipelinesLabel : string

    constructor(connectionString : string, dbName : string, containerName : string){
        this._connectionString = connectionString
        this._dbName = dbName
        this._containerName = containerName
        this._pipelinesLabel = "pipelines"
    }

    public abstract create(data) : Promise<any>;
    public abstract view(input : BpaServiceObject) : Promise<BpaServiceObject>
    public abstract getConfig() : Promise<BpaPipelines>
    public abstract getByID (id : string) : Promise<any>
    public abstract deleteByID (id : string) : Promise<any>
}

export class MongoDB extends DB {
    public getByID(id: string): Promise<any> {
        throw new Error("Method not implemented.")
    }
    public deleteByID(id: string): Promise<any> {
        throw new Error("Method not implemented.")
    }
    private _mongoClient : MongoClient

    constructor(connectionString : string, dbName : string, containerName : string) {
        super(connectionString, dbName, containerName)
        this._mongoClient = new MongoClient(connectionString)
    }

    public create = async (data) : Promise<any> => {
        try {
            await this._mongoClient.connect()
            const db = this._mongoClient.db(this._dbName)
            const collection = db.collection(this._containerName)
            const insertResult = await collection.insertOne(data)
         
            return insertResult
        } catch (err) {
            console.log(err)
        } finally{
            this._mongoClient.close()
        }
        return null
    }

    public view = async (input : BpaServiceObject) : Promise<BpaServiceObject> => {
        await this.create(input)
        return input
    }
    
    public getConfig = async () : Promise<any> => {
        try {
            await this._mongoClient.connect()
            const db = this._mongoClient.db(this._dbName)
            const collection = db.collection(this._containerName)
            const item = await collection.findOne({_id : this._pipelinesLabel})
            return item as any
        } catch (err) {
            console.log(err)
        } finally{
            this._mongoClient.close()
        }
        return null
    }


}


export class CosmosDB extends DB {

    constructor(connectionString : string | undefined, dbName : string | undefined, containerName : string | undefined) {
        super(connectionString, dbName, containerName)
        
    }

    public create = async (data) : Promise<any> => {
        try {
            const client = new CosmosClient(this._connectionString);
            //console.log(`db: ${this._dbName}`)
            const database = client.database(this._dbName);
            const container = database.container(this._containerName);
            //console.log(`container: ${this._containerName}`)
            const { resource: createdItem } = await container.items.upsert(data);
            return createdItem
        } catch (err) {
            console.log(err)
        }
        return null
    }

    public view = async (input : BpaServiceObject) : Promise<BpaServiceObject> => {
        await this.create(input)
        return input
    }
    
    public getConfig = async () : Promise<BpaPipelines> => {
        try{
            const client = new CosmosClient(this._connectionString);
            const database = client.database(this._dbName);
            const container = database.container(this._containerName);
            const item = await container.item(this._pipelinesLabel).read()
            return item.resource
        } catch(err){
            console.log(err)
        }
        return null
    }

    public getByID = async (id : string) : Promise<any> => {
        try{
            const client = new CosmosClient(this._connectionString);
            const database = client.database(this._dbName);
            const container = database.container(this._containerName);
            const item = await container.item(id).read()
            return item.resource
        } catch(err){
            console.log(err)
        }
        return null
    }

    public deleteByID = async (id : string) : Promise<any> => {
        try{
            const client = new CosmosClient(this._connectionString);
            const database = client.database(this._dbName);
            const container = database.container(this._containerName);
            const item = await container.item(id).delete();
            return item.resource
        } catch(err){
            console.log(err)
        }
        return null
    }
}