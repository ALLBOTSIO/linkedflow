/**
 * Copyright (c) 2026 LinkedFlow Technologies
 * Licensed under the Business Source License 1.1
 * You may not use this file except in compliance with the License.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { PrismaClient } from '@prisma/client'
import app from '../src/server/index'
import { LeadStatus, LeadSource } from '../src/types/enums'

const prisma = new PrismaClient()

// Test CSV data with 50 leads
const testCSVData = `first_name,last_name,linkedin_url,email,company,title,location,notes,tags
John,Doe,https://linkedin.com/in/john-doe,john.doe@example.com,TechCorp,Software Engineer,San Francisco,Great candidate,"tech,engineering"
Jane,Smith,https://linkedin.com/in/jane-smith,jane.smith@example.com,DesignCo,UX Designer,New York,Creative professional,"design,ux"
Mike,Johnson,https://linkedin.com/in/mike-johnson,mike.j@example.com,DataInc,Data Scientist,Austin,Analytics expert,"data,science"
Sarah,Williams,https://linkedin.com/in/sarah-williams,sarah.w@example.com,CloudTech,DevOps Engineer,Seattle,Infrastructure specialist,"devops,cloud"
Tom,Brown,https://linkedin.com/in/tom-brown,tom.brown@example.com,StartupX,Product Manager,Boston,Product leadership,"product,strategy"
Lisa,Davis,https://linkedin.com/in/lisa-davis,lisa.davis@example.com,FinTech Solutions,Financial Analyst,Chicago,Finance expert,"finance,analytics"
David,Miller,https://linkedin.com/in/david-miller,david.m@example.com,HealthTech,Medical Researcher,Los Angeles,Healthcare innovation,"healthcare,research"
Emma,Wilson,https://linkedin.com/in/emma-wilson,emma.w@example.com,EduTech,Learning Designer,Portland,Education technology,"education,design"
Chris,Moore,https://linkedin.com/in/chris-moore,chris.moore@example.com,GreenEnergy,Sustainability Engineer,Denver,Environmental focus,"sustainability,engineering"
Amy,Taylor,https://linkedin.com/in/amy-taylor,amy.taylor@example.com,RetailTech,E-commerce Manager,Miami,Retail innovation,"retail,ecommerce"
Robert,Anderson,https://linkedin.com/in/robert-anderson,robert.a@example.com,CyberSec,Security Analyst,Washington DC,Cybersecurity expert,"security,cyber"
Jennifer,Thomas,https://linkedin.com/in/jennifer-thomas,jennifer.t@example.com,AI Labs,ML Engineer,San Diego,Machine learning,"ai,ml"
Kevin,Jackson,https://linkedin.com/in/kevin-jackson,kevin.j@example.com,GameStudio,Game Developer,Orlando,Gaming industry,"gaming,development"
Michelle,White,https://linkedin.com/in/michelle-white,michelle.w@example.com,MediaCorp,Content Strategist,Atlanta,Content creation,"media,content"
Steven,Harris,https://linkedin.com/in/steven-harris,steven.h@example.com,LogisticsPro,Supply Chain Manager,Phoenix,Logistics optimization,"logistics,supply"
Nicole,Martin,https://linkedin.com/in/nicole-martin,nicole.m@example.com,BioTech,Biomedical Engineer,Philadelphia,Biotechnology,"biotech,engineering"
Daniel,Garcia,https://linkedin.com/in/daniel-garcia,daniel.g@example.com,ArchFirm,Software Architect,Houston,Architecture design,"architecture,software"
Rachel,Rodriguez,https://linkedin.com/in/rachel-rodriguez,rachel.r@example.com,ConsultingGroup,Management Consultant,Dallas,Business consulting,"consulting,management"
Brandon,Lewis,https://linkedin.com/in/brandon-lewis,brandon.l@example.com,SportsData,Sports Analyst,Minneapolis,Sports analytics,"sports,analytics"
Stephanie,Lee,https://linkedin.com/in/stephanie-lee,stephanie.l@example.com,TravelTech,UX Researcher,Las Vegas,Travel industry,"travel,research"
Jason,Walker,https://linkedin.com/in/jason-walker,jason.w@example.com,InsureTech,Risk Analyst,Nashville,Insurance technology,"insurance,risk"
Amanda,Hall,https://linkedin.com/in/amanda-hall,amanda.h@example.com,FoodTech,Product Designer,Salt Lake City,Food innovation,"food,design"
Ryan,Allen,https://linkedin.com/in/ryan-allen,ryan.a@example.com,PropTech,Real Estate Analyst,Charlotte,Property technology,"proptech,realestate"
Melissa,Young,https://linkedin.com/in/melissa-young,melissa.y@example.com,MusicTech,Audio Engineer,Nashville,Music technology,"music,audio"
Andrew,Hernandez,https://linkedin.com/in/andrew-hernandez,andrew.h@example.com,SpaceTech,Aerospace Engineer,Huntsville,Space industry,"aerospace,space"
Lauren,King,https://linkedin.com/in/lauren-king,lauren.k@example.com,FashionTech,Digital Marketing Manager,New York,Fashion technology,"fashion,marketing"
Joshua,Wright,https://linkedin.com/in/joshua-wright,joshua.w@example.com,AgriTech,Agricultural Scientist,Iowa City,Agriculture innovation,"agriculture,science"
Kimberly,Lopez,https://linkedin.com/in/kimberly-lopez,kimberly.l@example.com,CleanTech,Environmental Engineer,Sacramento,Clean technology,"cleantech,environment"
Matthew,Hill,https://linkedin.com/in/matthew-hill,matthew.h@example.com,QuantumCorp,Quantum Physicist,Berkeley,Quantum computing,"quantum,physics"
Ashley,Scott,https://linkedin.com/in/ashley-scott,ashley.s@example.com,RoboTech,Robotics Engineer,Pittsburgh,Robotics industry,"robotics,engineering"
James,Green,https://linkedin.com/in/james-green,james.g@example.com,BlockchainInc,Blockchain Developer,Austin,Cryptocurrency expert,"blockchain,crypto"
Jessica,Adams,https://linkedin.com/in/jessica-adams,jessica.a@example.com,VRStudio,VR Developer,San Francisco,Virtual reality,"vr,development"
Nicholas,Baker,https://linkedin.com/in/nicholas-baker,nicholas.b@example.com,DrugDiscovery,Pharmaceutical Scientist,Boston,Drug development,"pharma,research"
Samantha,Gonzalez,https://linkedin.com/in/samantha-gonzalez,samantha.g@example.com,SmartCity,Urban Planner,Portland,Smart cities,"urban,planning"
Jonathan,Nelson,https://linkedin.com/in/jonathan-nelson,jonathan.n@example.com,EnergyGrid,Grid Engineer,Houston,Energy infrastructure,"energy,grid"
Brittany,Carter,https://linkedin.com/in/brittany-carter,brittany.c@example.com,PetTech,Veterinary Scientist,Denver,Pet technology,"pettech,veterinary"
Tyler,Mitchell,https://linkedin.com/in/tyler-mitchell,tyler.m@example.com,AutoTech,Automotive Engineer,Detroit,Autonomous vehicles,"automotive,autonomous"
Megan,Perez,https://linkedin.com/in/megan-perez,megan.p@example.com,WaterTech,Water Engineer,Phoenix,Water technology,"water,engineering"
Gregory,Roberts,https://linkedin.com/in/gregory-roberts,gregory.r@example.com,NanoTech,Materials Scientist,Research Triangle,Nanotechnology,"nanotech,materials"
Heather,Turner,https://linkedin.com/in/heather-turner,heather.t@example.com,SolarTech,Solar Engineer,Phoenix,Solar energy,"solar,renewable"
Anthony,Phillips,https://linkedin.com/in/anthony-phillips,anthony.p@example.com,WindPower,Wind Engineer,Des Moines,Wind energy,"wind,renewable"
Crystal,Campbell,https://linkedin.com/in/crystal-campbell,crystal.c@example.com,OceanTech,Marine Biologist,San Diego,Ocean technology,"ocean,marine"
Eric,Parker,https://linkedin.com/in/eric-parker,eric.p@example.com,WeatherTech,Meteorologist,Boulder,Weather technology,"weather,climate"
Danielle,Evans,https://linkedin.com/in/danielle-evans,danielle.e@example.com,MineTech,Mining Engineer,Denver,Mining technology,"mining,extraction"
Jordan,Edwards,https://linkedin.com/in/jordan-edwards,jordan.e@example.com,RecycleTech,Waste Engineer,Seattle,Recycling technology,"recycling,waste"
Alexis,Collins,https://linkedin.com/in/alexis-collins,alexis.c@example.com,SmartHome,IoT Engineer,San Jose,Smart home technology,"iot,smarthome"
Justin,Stewart,https://linkedin.com/in/justin-stewart,justin.s@example.com,QuantumNet,Network Engineer,Seattle,Quantum networking,"quantum,networking"
Courtney,Sanchez,https://linkedin.com/in/courtney-sanchez,courtney.s@example.com,NeuroTech,Neuroscientist,San Francisco,Brain-computer interfaces,"neurotech,bci"
Patrick,Morris,https://linkedin.com/in/patrick-morris,patrick.m@example.com,SpaceX,Rocket Engineer,Hawthorne,Space exploration,"space,rockets"
Kathryn,Rogers,https://linkedin.com/in/kathryn-rogers,kathryn.r@example.com,DeepSea,Ocean Engineer,Woods Hole,Deep sea exploration,"ocean,exploration"`

describe('Lead CSV Import System', () => {
  beforeAll(async () => {
    // Ensure database is connected
    await prisma.$connect()
  })

  afterAll(async () => {
    // Clean up and disconnect
    await prisma.lead.deleteMany({})
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    // Clean the database before each test
    await prisma.lead.deleteMany({})
  })

  describe('CSV Import Endpoint', () => {
    it('should create 50 leads via CSV upload endpoint', async () => {
      // Create CSV buffer
      const csvBuffer = Buffer.from(testCSVData, 'utf-8')

      const response = await request(app)
        .post('/api/leads/import')
        .attach('file', csvBuffer, 'test-leads.csv')
        .field('skipErrors', 'true')
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalRows: 50,
          successCount: 50,
          errorCount: 0,
          duplicateCount: 0,
          errors: []
        }
      })

      // Verify in database
      const leadCount = await prisma.lead.count()
      expect(leadCount).toBe(50)

      // Verify first lead details
      const firstLead = await prisma.lead.findFirst({
        where: { first_name: 'John', last_name: 'Doe' }
      })

      expect(firstLead).toMatchObject({
        first_name: 'John',
        last_name: 'Doe',
        linkedin_url: 'https://linkedin.com/in/john-doe',
        email: 'john.doe@example.com',
        company: 'TechCorp',
        title: 'Software Engineer',
        location: 'San Francisco',
        status: LeadStatus.IMPORTED,
        source: LeadSource.CSV_IMPORT,
        notes: 'Great candidate'
      })

      // Verify tags are parsed correctly
      expect(JSON.parse(firstLead?.tags || '[]')).toEqual(['tech', 'engineering'])
    })

    it('should detect duplicates when re-uploading the same CSV', async () => {
      // First upload
      const csvBuffer = Buffer.from(testCSVData, 'utf-8')

      await request(app)
        .post('/api/leads/import')
        .attach('file', csvBuffer, 'test-leads.csv')
        .field('skipErrors', 'true')
        .expect(201)

      // Second upload (duplicates)
      const duplicateResponse = await request(app)
        .post('/api/leads/import')
        .attach('file', csvBuffer, 'test-leads-duplicate.csv')
        .field('skipErrors', 'true')
        .expect(201)

      expect(duplicateResponse.body).toMatchObject({
        success: true,
        data: {
          totalRows: 50,
          successCount: 0,
          errorCount: 50, // All should be duplicates
          duplicateCount: 50
        }
      })

      // Verify total count is still 50 (no duplicates created)
      const leadCount = await prisma.lead.count()
      expect(leadCount).toBe(50)

      // Verify all errors are duplicate errors
      const errors = duplicateResponse.body.data.errors
      expect(errors).toHaveLength(50)
      expect(errors[0]).toMatchObject({
        field: 'linkedin_url',
        message: 'Lead with this LinkedIn URL already exists'
      })
    })

    it('should maintain data integrity for all imported leads', async () => {
      const csvBuffer = Buffer.from(testCSVData, 'utf-8')

      await request(app)
        .post('/api/leads/import')
        .attach('file', csvBuffer, 'test-leads.csv')
        .field('skipErrors', 'true')
        .expect(201)

      // Verify unique LinkedIn URLs
      const leads = await prisma.lead.findMany({
        select: { linkedin_url: true }
      })

      const uniqueUrls = new Set(leads.map(lead => lead.linkedin_url))
      expect(uniqueUrls.size).toBe(50) // All URLs should be unique

      // Verify all required fields are present
      const leadsWithMissingData = await prisma.lead.findMany({
        where: {
          OR: [
            { first_name: { equals: null } },
            { first_name: { equals: '' } },
            { last_name: { equals: null } },
            { last_name: { equals: '' } },
            { linkedin_url: { equals: null } },
            { linkedin_url: { equals: '' } }
          ]
        }
      })

      expect(leadsWithMissingData).toHaveLength(0)

      // Verify all leads have correct status and source
      const statusCount = await prisma.lead.count({
        where: { status: LeadStatus.IMPORTED }
      })
      expect(statusCount).toBe(50)

      const sourceCount = await prisma.lead.count({
        where: { source: LeadSource.CSV_IMPORT }
      })
      expect(sourceCount).toBe(50)
    })

    it('should handle invalid CSV files gracefully', async () => {
      const invalidCSV = 'invalid,csv,data\nwithout,proper,headers'
      const csvBuffer = Buffer.from(invalidCSV, 'utf-8')

      const response = await request(app)
        .post('/api/leads/import')
        .attach('file', csvBuffer, 'invalid.csv')
        .field('skipErrors', 'true')
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.successCount).toBe(0)
      expect(response.body.data.errorCount).toBeGreaterThan(0)

      // Verify no leads were created
      const leadCount = await prisma.lead.count()
      expect(leadCount).toBe(0)
    })

    it('should validate file type restrictions', async () => {
      const textBuffer = Buffer.from('This is not a CSV file', 'utf-8')

      await request(app)
        .post('/api/leads/import')
        .attach('file', textBuffer, 'not-a-csv.txt')
        .expect(400)

      // Verify no leads were created
      const leadCount = await prisma.lead.count()
      expect(leadCount).toBe(0)
    })
  })

  describe('Lead CRUD Operations', () => {
    it('should create a single lead via API', async () => {
      const leadData = {
        first_name: 'Test',
        last_name: 'User',
        linkedin_url: 'https://linkedin.com/in/test-user',
        email: 'test@example.com',
        company: 'Test Corp',
        title: 'Test Engineer'
      }

      const response = await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(201)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          first_name: 'Test',
          last_name: 'User',
          linkedin_url: 'https://linkedin.com/in/test-user',
          email: 'test@example.com',
          company: 'Test Corp',
          title: 'Test Engineer',
          status: LeadStatus.IMPORTED,
          source: LeadSource.MANUAL_ENTRY
        }
      })

      const leadId = response.body.data.id
      expect(leadId).toBeDefined()
    })

    it('should retrieve leads with pagination', async () => {
      // Create a few leads first
      const csvBuffer = Buffer.from(testCSVData, 'utf-8')
      await request(app)
        .post('/api/leads/import')
        .attach('file', csvBuffer, 'test-leads.csv')

      const response = await request(app)
        .get('/api/leads?page=1&limit=10')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            first_name: expect.any(String),
            last_name: expect.any(String),
            linkedin_url: expect.any(String)
          })
        ]),
        meta: {
          page: 1,
          limit: 10,
          total: 50,
          totalPages: 5,
          hasNext: true,
          hasPrev: false
        }
      })

      expect(response.body.data).toHaveLength(10)
    })

    it('should update a lead', async () => {
      // Create a lead first
      const leadData = {
        first_name: 'Original',
        last_name: 'Name',
        linkedin_url: 'https://linkedin.com/in/original-name'
      }

      const createResponse = await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(201)

      const leadId = createResponse.body.data.id

      // Update the lead
      const updateData = {
        first_name: 'Updated',
        company: 'Updated Corp'
      }

      const updateResponse = await request(app)
        .put(`/api/leads/${leadId}`)
        .send(updateData)
        .expect(200)

      expect(updateResponse.body).toMatchObject({
        success: true,
        data: {
          id: leadId,
          first_name: 'Updated',
          last_name: 'Name', // Should remain unchanged
          company: 'Updated Corp',
          linkedin_url: 'https://linkedin.com/in/original-name' // Should remain unchanged
        }
      })
    })

    it('should delete a lead', async () => {
      // Create a lead first
      const leadData = {
        first_name: 'ToDelete',
        last_name: 'User',
        linkedin_url: 'https://linkedin.com/in/to-delete'
      }

      const createResponse = await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(201)

      const leadId = createResponse.body.data.id

      // Delete the lead
      await request(app)
        .delete(`/api/leads/${leadId}`)
        .expect(200)

      // Verify it's deleted
      await request(app)
        .get(`/api/leads/${leadId}`)
        .expect(404)
    })
  })

  describe('CSV Validation', () => {
    it('should validate CSV format before import', async () => {
      const csvBuffer = Buffer.from(testCSVData, 'utf-8')

      const response = await request(app)
        .post('/api/leads/validate-csv')
        .attach('file', csvBuffer, 'test-leads.csv')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          isValid: true,
          errors: [],
          totalRows: 50,
          preview: expect.arrayContaining([
            expect.objectContaining({
              first_name: expect.any(String),
              last_name: expect.any(String),
              linkedin_url: expect.any(String)
            })
          ])
        }
      })

      expect(response.body.data.preview).toHaveLength(5) // Preview should show 5 rows
    })
  })

  describe('Import Statistics', () => {
    it('should return import statistics', async () => {
      // Import some leads first
      const csvBuffer = Buffer.from(testCSVData, 'utf-8')
      await request(app)
        .post('/api/leads/import')
        .attach('file', csvBuffer, 'test-leads.csv')

      const response = await request(app)
        .get('/api/leads/stats')
        .expect(200)

      expect(response.body).toMatchObject({
        success: true,
        data: {
          totalLeads: 50,
          leadsBySource: {
            [LeadSource.CSV_IMPORT]: 50
          },
          leadsByStatus: {
            [LeadStatus.IMPORTED]: 50
          },
          recentImports: 50
        }
      })
    })
  })
})